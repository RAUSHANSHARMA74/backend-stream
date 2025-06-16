// let adminSocketId = null;

// module.exports = function (io) {
//     io.on('connection', (socket) => {
//         socket.on('join-room', ({ roomId, userType }) => {
//             socket.join(roomId);

//             if (userType === 'admin') {
//                 adminSocketId = socket.id;
//             } else if (adminSocketId) {
//                 // Notify admin of new user
//                 io.to(adminSocketId).emit('new-user', { userSocketId: socket.id });

//                 // Notify user that admin is ready
//                 io.to(socket.id).emit('admin-ready', { adminSocketId });
//             }
//         });

//         socket.on('offer', ({ sdp, target }) => {
//             io.to(target).emit('offer', { sdp, caller: socket.id });
//         });

//         socket.on('answer', ({ sdp, target }) => {
//             io.to(target).emit('answer', { sdp, caller: socket.id });
//         });

//         socket.on('ice-candidate', ({ candidate, target }) => {
//             io.to(target).emit('ice-candidate', { candidate, sender: socket.id });
//         });

//         socket.on('disconnect', () => {
//             if (socket.id === adminSocketId) {
//                 adminSocketId = null;
//             } else if (adminSocketId) {
//                 io.to(adminSocketId).emit('user-disconnected', { userSocketId: socket.id });
//             }
//         });
//     });
// };




let adminSocketId = null;
const connectedUsers = new Set(); // Track connected user socket IDs

module.exports = function (io) {
    io.on('connection', (socket) => {
        socket.on('join-room', ({ roomId, userType }) => {
            socket.join(roomId);

            if (userType === 'admin') {
                adminSocketId = socket.id;

                // 🔁 Admin connected or refreshed — notify all users
                connectedUsers.forEach((userId) => {
                    io.to(userId).emit('admin-ready', { adminSocketId });
                });

            } else {
                // ✅ Add user to connected users
                connectedUsers.add(socket.id);

                // Notify admin
                if (adminSocketId) {
                    io.to(adminSocketId).emit('new-user', { userSocketId: socket.id });

                    // Notify user that admin is ready
                    io.to(socket.id).emit('admin-ready', { adminSocketId });
                }
            }
        });

        socket.on('offer', ({ sdp, target }) => {
            io.to(target).emit('offer', { sdp, caller: socket.id });
        });

        socket.on('answer', ({ sdp, target }) => {
            io.to(target).emit('answer', { sdp, caller: socket.id });
        });

        socket.on('ice-candidate', ({ candidate, target }) => {
            io.to(target).emit('ice-candidate', { candidate, sender: socket.id });
        });

        socket.on('disconnect', () => {
            if (socket.id === adminSocketId) {
                adminSocketId = null;
            } else {
                connectedUsers.delete(socket.id); // ❌ Remove disconnected user
                if (adminSocketId) {
                    io.to(adminSocketId).emit('user-disconnected', { userSocketId: socket.id });
                }
            }
        });
    });
};
