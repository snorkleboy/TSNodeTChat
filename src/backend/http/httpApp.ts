function httpApp(req, res) {
    res.end("hello http");
    // fs.readFile(__dirname + '/index.html',
    //     function (err, data) {
    //         if (err) {
    //             res.writeHead(500);
    //             return res.end('Error loading index.html');
    //         }

    //         res.writeHead(200);
    //         res.end(data);
    //     });
}
export {httpApp};
