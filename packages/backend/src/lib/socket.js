"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setSocketService = setSocketService;
exports.getSocketService = getSocketService;
let instance = null;
function setSocketService(s) {
    instance = s;
}
function getSocketService() {
    if (!instance)
        throw new Error('SocketService not initialized');
    return instance;
}
//# sourceMappingURL=socket.js.map