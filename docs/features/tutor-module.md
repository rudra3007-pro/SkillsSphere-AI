# Tutor Module

The Tutor Module is a comprehensive suite of tools designed specifically for educators and technical mentors. It bridges the gap between passive tracking and active intervention, providing Tutors with deeply integrated analytics to identify cohort-wide skill gaps, and the real-time collaboration tools (Live Classrooms) needed to address those gaps instantly.

This document serves as the exhaustive technical reference for the Tutor Module's architecture, WebRTC streaming logic, state synchronization, and data aggregation pipelines.

---

## 1. High-Level System Architecture & Component Interactions

The Tutor Module operates on a hybrid architecture, combining the high throughput of WebRTC for media with the reliable, ordered delivery of WebSockets for application state.

### Architectural Pillars
1. **Signaling Server (Socket.IO)**: The Node.js backend acts strictly as a signaling router. It manages the `roomStates` in memory, broadcasting `webrtc-offer` and `webrtc-answer` payloads between clients to facilitate peer connections. It never touches raw audio or video data.
2. **Media Delivery (WebRTC Mesh)**: Handled by `simple-peer` on the client side. Once signaled, browsers establish direct peer-to-peer (P2P) connections.
3. **Analytics Engine (MongoDB)**: The backend relies heavily on MongoDB Aggregation Framework to scan thousands of student profiles and resumes in real-time, outputting actionable metrics without heavy caching.

---

## 2. Sub-Module Deep Dive: Live Interactive Classrooms

The Classroom environment is the most latency-sensitive part of the application. It supports simultaneous multi-user video, a collaborative whiteboard, and a shared code editor.

### The WebRTC Handshake & Signaling Sequence

When a Tutor creates a room and Students join, a complex handshake occurs to establish the P2P mesh network.

```mermaid
sequenceDiagram
    autonumber
    actor Student
    participant FE as React Frontend (ClassroomRoom.jsx)
    participant IO as Socket.IO Server (classrooms/socket.js)
    participant State as Node.js In-Memory Map
    actor Tutor

    Note over Tutor, FE: 1. Room Initialization
    Tutor->>FE: Creates Session (POST /api/classrooms/create)
    FE->>IO: emit 'join-room' { roomId: "uuid-1234" }
    IO->>State: Initialize Room State object
    
    Note over Student, IO: 2. Student Joins
    Student->>FE: Navigates to /classrooms/uuid-1234
    FE->>IO: emit 'join-room'
    IO-->>FE: Returns 'room-participants' (Array of existing Socket IDs)
    IO-->>Tutor: emit 'user-joined' (Student's Socket ID)
    
    Note over Student, Tutor: 3. WebRTC Signaling (Student is Initiator)
    Student->>FE: Generates WebRTC Offer (SDP)
    Student->>IO: emit 'webrtc-offer' { target: TutorId, offer }
    IO->>Tutor: forward 'webrtc-offer'
    
    Tutor->>FE: Applies Remote Offer, Generates Answer (SDP)
    Tutor->>IO: emit 'webrtc-answer' { target: StudentId, answer }
    IO->>Student: forward 'webrtc-answer'
    
    Note over Student, Tutor: 4. P2P Connection
    Student<-->>Tutor: ICE Candidate Exchange & Stream Establishment
    
    Note over Student, Tutor: 5. Application State Sync
    Tutor->>IO: emit 'code-change'
    IO->>State: Update memory cache
    IO->>Student: broadcast 'code-change'
```

### Technical Implementation Details

#### 1. Track Replacement (Screen Sharing)
A critical feature is the ability to share a screen without dropping the active WebRTC connection. Tearing down the connection to add a new video track causes unacceptable latency. Instead, we use `RTCRtpSender.replaceTrack()`.

```javascript
// client/src/modules/classrooms/pages/ClassroomRoom.jsx
const toggleScreenShare = async () => {
  try {
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    screenStreamRef.current = stream;
    const screenTrack = stream.getVideoTracks()[0];
    const cameraTrack = localStreamRef.current?.getVideoTracks()[0];
    
    // Iterate over all active peer connections and hot-swap the track
    if (cameraTrack) {
      peersRef.current.forEach(p => {
        p.peer.replaceTrack(cameraTrack, screenTrack, localStreamRef.current);
      });
    }
  } catch (err) {
    console.error("Screen share failed", err);
  }
};
```

#### 2. Whiteboard Normalization
To ensure that a stroke drawn by a Tutor on a 4K monitor appears exactly in the same relative position for a Student on a 13-inch laptop, the frontend normalizes all coordinates before emitting them.

```javascript
// client/src/modules/classrooms/components/Whiteboard.jsx
const emitDrawEvent = (x, y, color) => {
  const canvas = canvasRef.current;
  const normalizedX = x / canvas.width;  // Value between 0.0 and 1.0
  const normalizedY = y / canvas.width;  // Value between 0.0 and 1.0
  
  socket.emit('draw-stroke', { roomId, x: normalizedX, y: normalizedY, color });
};

// On the receiving end:
socket.on('draw-stroke', (data) => {
  const realX = data.x * canvasRef.current.width;
  const realY = data.y * canvasRef.current.width;
  drawToCanvas(realX, realY, data.color);
});
```

#### 3. Code Editor Echo Loops
When integrating Monaco Editor, collaborative typing can create an infinite echo loop (Client A types -> Emits to Server -> Broadcasts to Client B -> Client B updates Editor -> Client B's Editor triggers onChange -> Emits to Server).
To prevent this, the component utilizes an `isRemoteChangeRef`.

```javascript
// client/src/modules/classrooms/components/SharedCodeEditor.jsx
socket.on('code-change', (newCode) => {
  isRemoteChangeRef.current = true; // Lock local emissions
  editorRef.current.setValue(newCode); // Update UI
  setTimeout(() => isRemoteChangeRef.current = false, 50); // Unlock
});

const handleEditorChange = (value) => {
  if (!isRemoteChangeRef.current) {
    socket.emit('code-change', { roomId, code: value });
  }
};
```

#### 4. Disconnection & State Persistence
During the session, chat and code are stored in Node.js RAM (`roomStates` Map) for maximum speed. When the Tutor clicks "End Session", the `classrooms/socket.js` detects the `disconnect` or `end-session` event, reads the final state from the Map, and persists it to the `ClassroomSession` document in MongoDB, freeing up RAM.

---

## 3. Sub-Module Deep Dive: Analytics & Skill Gaps

Tutors need to know *what* to teach. The Analytics Dashboard provides a macro-view of the student cohort's weaknesses.

### The Skill Gap Algorithm
Instead of relying on self-reported data, the system analyzes the actual, verified Resumes of the students. It utilizes a MongoDB Aggregation Pipeline to count occurrences and calculate a `gapScore`.

```javascript
// server/src/modules/analytics/controller.js
export const getSkillGaps = async (req, res) => {
  const pipeline = [
    // 1. Unwind the skills array from all active resumes
    { $unwind: "$skills" },
    // 2. Normalize case to prevent "React" and "react" from splitting
    { $project: { skill: { $toLower: "$skills.name" } } },
    // 3. Group and Count
    { $group: { _id: "$skill", count: { $sum: 1 } } },
    // 4. Sort by most frequent
    { $sort: { count: -1 } },
    { $limit: 50 }
  ];

  const skillDistribution = await Resume.aggregate(pipeline);
  
  // 5. Calculate the proprietary Gap Score
  const results = skillDistribution.map(item => {
    // Formula: Assume a baseline of 10 students. 
    // If only 1 student has the skill, the gap is high (90).
    const gapScore = Math.max(1, 100 - (item.count * 10));
    return { name: item._id, count: item.count, gapScore };
  });

  res.json(results);
};
```

### Dashboard Visualizations
The frontend (`TutorAnalyticsDashboard.jsx`) heavily utilizes the `Recharts` library.
- **Treemap Heatmap**: Renders nested, colored rectangles based on the frequency of skills. High-frequency skills are larger.
- **Horizontal Bar Chart**: Focuses specifically on the `gapScore`, sorted descending, visually flagging the immediate areas where the Tutor should focus their next Live Classroom curriculum.

---

## 4. Exhaustive Database Models

### A. ClassroomSession Schema (`server/src/database/models/ClassroomSession.js`)

Tracks the metadata and final snapshots of live classrooms for auditing and student review.

```json
{
  "_id": "ObjectId",
  "roomId": "UUID-String",
  "host": "ObjectId (ref: User)",
  "title": "Advanced Data Structures Review",
  "subject": "Algorithms",
  "status": "ended", // 'active' or 'ended'
  "startedAt": "ISODate",
  "endedAt": "ISODate",
  "chatHistory": [
    {
      "sender": {
        "name": "Arsh Verma",
        "id": "ObjectId"
      },
      "message": "Can we go over Dijkstra's algorithm?",
      "timestamp": "ISODate"
    }
  ],
  "codeSnapshot": "function dijkstra(graph, start) {\n  // Implementation here...\n}"
}
```

---

## 5. Comprehensive API Endpoints Contract

### Classrooms REST API (`/api/classrooms`)

| Method | Endpoint | Description | Auth | Request Payload | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/create` | Generate a new session | Tutor | `{ title, subject }` | `201 Created`: `{ roomId, sessionDoc }` |
| `GET` | `/my-sessions` | List tutor's history | Tutor | - | `200 OK`: `[ { sessionList } ]` |
| `GET` | `/active` | List all live sessions | Any | - | `200 OK`: `[ { activeRooms } ]` |
| `PATCH`| `/:roomId/end` | Persist and close room | Tutor | `{ chatHistory, codeSnapshot }` | `200 OK`: `{ success: true }` |

### Analytics REST API (`/api/analytics`)

| Method | Endpoint | Description | Auth | Request Payload | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/skill-gaps` | Aggregated heatmap data | Tutor | - | `200 OK`: `[ { name, count, gapScore } ]` |
| `GET` | `/dashboard` | Platform metrics | Tutor | - | `200 OK`: `{ activeStudents, avgMockScore }` |

### Detailed Socket.IO Event Payloads

| Event Name | Direction | Payload Example | Description |
| :--- | :--- | :--- | :--- |
| `join-room` | Client → Server | `{ roomId: "123", user: { id: "xx", name: "Alice" } }` | Authenticates and joins a socket room. |
| `webrtc-offer` | Client → Server | `{ targetSocketId: "A1", callerSocketId: "B2", offer: { type: "offer", sdp: "v=0..." } }` | Relays WebRTC initiation packet. |
| `room-participants` | Server → Client | `[ { socketId: "A1", user: {...} } ]` | Sent upon joining room to map the mesh. |
| `draw-stroke` | Bi-directional | `{ roomId: "123", x: 0.5, y: 0.2, color: "#ff0000" }` | Syncs a single coordinate to the Canvas. |
| `code-change` | Bi-directional | `{ roomId: "123", code: "const x = 1;" }` | Syncs full document string to Monaco. |

---

## 6. Security, Limitations & Scaling

### Socket Cross-Room Injection
A malicious student could attempt to emit a `chat-message` or `draw-stroke` with a `roomId` they are not currently inside. 
**Mitigation**: The `socket.js` backend attaches the verified `roomId` to the socket object during the initial `join-room` phase (`socket.data.roomId = payload.roomId`). All subsequent emissions ignore the payload's roomId and strictly use the verified `socket.data.roomId` for broadcasting.

### Mesh Network Limitations
The Live Classroom utilizes a **Full Mesh Network** topology via `simple-peer`. Every peer connects directly to every other peer.
- 2 participants = 1 connection.
- 5 participants = 10 connections.
- 10 participants = 45 connections.

Because the client must encode and upload their video stream separately for *each* connection, bandwidth and CPU usage scale exponentially.
**Scaling Strategy**: The current architecture is recommended for small cohort sizes (5-8 participants). If the platform scales to support large lecture halls (50+ students), the WebRTC module must be migrated away from `simple-peer` to an **SFU (Selective Forwarding Unit)** architecture (e.g., using `mediasoup` or `Janus`), where the client uploads their stream exactly once to the server, and the server distributes it to the viewers.

---

## 7. Directory & Key Files Reference

To quickly navigate the codebase for Tutor features:

**Frontend Components (`client/src/modules/`)**
- `classrooms/pages/ClassroomsDashboard.jsx` - UI for creating new sessions.
- `classrooms/pages/ClassroomRoom.jsx` - The monolithic WebRTC mesh orchestrator.
- `classrooms/components/Whiteboard.jsx` - HTML5 Canvas drawing logic.
- `classrooms/components/SharedCodeEditor.jsx` - Monaco Editor integration with echo-loop prevention.
- `analytics/TutorAnalyticsDashboard.jsx` - Recharts visualizations for the `gapScore`.

**Backend Services (`server/src/modules/`)**
- `classrooms/socket.js` - In-memory state maps and WebSocket signaling router.
- `classrooms/controller.js` - REST API for session metadata and teardown persistence.
- `analytics/controller.js` - MongoDB aggregation pipelines calculating the skill gaps.
