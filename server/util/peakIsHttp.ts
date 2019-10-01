var peek = require('socket-peek');


const isHttp = (str: string) => {
    if (!str) {
        return false;
    }
    const newLine = str.indexOf("\n") || 100;
    const split = str.slice(0, newLine).split(`/`);
    if (!split[1]) {
        return false;
    }
    if (split[1].toLocaleLowerCase().includes("http")) {
        return true;
    } else {
        return false;
    }
}
export const peekIsHttp = (socket) => {
    var buffer = Buffer.alloc(1000);
    var ret = peek(socket._handle.fd, 1000, buffer);
    let httpBool = false;
    if (ret > 0) {
        const msg = buffer.slice(0, ret).toString('utf8');
        httpBool = isHttp(msg);
    }
    return httpBool;
}
