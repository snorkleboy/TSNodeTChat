import { Store } from "../lib/store/store";

const url = require('url');
const fs = require('fs');
const Path = require('path');
const mimeType = {
    '.ico': 'image/x-icon',
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml',
};
function httpApp(req, res) {
    // parse URL
    const parsedUrl = url.parse(req.url);
    if(parsedUrl.path === "/state"){
        console.log("state return");
        res.setHeader('Content-type', mimeType[".json"] || 'text/plain');
        res.end(JSON.stringify(Store.getStore(), getCircularReplacer()));
    }else{
        fileBrowser(
            Path.normalize(parsedUrl.pathname).replace(/^(\.\.[\/\\])+/, ''),
            (pathname,data)=>{
                // based on the URL path, extract the file extention. e.g. .js, .doc, ...
                const ext = Path.parse(pathname).ext;
                // if the file is found, set Content-type and send data
                res.setHeader('Content-type', mimeType[ext] || 'text/plain');
                res.end(data);
            },
            (pathname,err)=>{
                res.statusCode = 500;
                console.error(`Error getting the file: ${err}.`)
                res.end(`Error getting the file: ${err}.`);
            },
            (pathname) => {
                // if the file is not found, return 404
                res.statusCode = 404;
                res.end(`File ${pathname} not found!`);
            },
        )
    }
}
const getCircularReplacer = () => {
    const seen = new WeakSet();
    return (key, value) => {
        let ret;
        if (typeof value === "object" && value !== null) {
            if (seen.has(value)) {
                ret = `${value?.constructor?.name ?? "dup"} (id=${value.id ?? "no id"})`
            }else{
                seen.add(value)
                if (value && value.toJson) {
                    ret = value.toJson();
                }else{
                    ret = value;
                }
            }
        }else{
            ret = value;
        }
        return ret;
    };
};
const fileBrowser = (pathname,onFile,onError,onNotFound)=>{
    pathname = Path.join(process.cwd() + "/public", pathname);
    fs.exists(pathname, function (exist) {
        // console.log({ exist,pathname });

        if (!exist) {
            onNotFound(pathname)
            return;
        }

        // if is a directory, then look for index.html
        if (fs.statSync(pathname).isDirectory()) {
            pathname += '/index.html';
        }

        // read file from file system
        fs.readFile(pathname, function (err, data) {
            if (err) {
                onError(pathname,err)
            } else {
                onFile(pathname,data);
            }
        });
    });
}
export {httpApp};
