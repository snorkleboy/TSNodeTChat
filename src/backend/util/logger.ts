import * as fs from 'fs';
export default ()=>{
    const myLogFileStream = fs.createWriteStream("./logs/server.log");
    const myConsole = new console.Console(myLogFileStream, myLogFileStream);
    const oldLog = console.log;
    const oldErr = console.error;
    const dayMs = 1000 * 60 * 60 * 24
    const getDateStamp = () => {
        const date = Date.now();
        const days = parseInt((date / dayMs) as any);
        const leftOver = (date % dayMs);
        const s = parseInt((leftOver % 60000) / 1000 as any);
        const min = parseInt((leftOver / 60000) as any);
        return `${days}:${min}:${s} -`
    }

    console.log = function (...args) {
        const timeStampedArgs = [getDateStamp(), ...args];
        oldLog(...args);
        myConsole.log(...timeStampedArgs);
    }

    console.error = function (...args) {
        const timeStampedArgs = [getDateStamp(), ...args];
        oldErr(...args);
        myConsole.error(...timeStampedArgs);
    }
    const bigLog =  (args,logger,deepLogger)=>{
        args = [...args];
        const lastArg = args.splice(args.length-1,1);
        logger(...args);
        deepLogger(...args,lastArg)
    };
    console['bigError'] = (...args)=>bigLog(args,console.error,myConsole);
    console['bigLog'] = (...args) => bigLog(args, console.log, myConsole);

    console.log("timeStamp format = Days:minutes:seconds")
}
