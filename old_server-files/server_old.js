const http = require("http");
const fs = require("fs");
const fsPromises = require("fs").promises;
const path = require("path");
const logEvent = require("../logEvent");
const PORT = process.env.port || 3500;
const EventEmitter = require("events");
class Emitter extends EventEmitter {}
const myEmitter = new Emitter();
myEmitter.on("log", (message, fileName) => {
  logEvent(message, fileName);
});

const serveFile = async function (filePath, contentType, response) {
  try {
    const rawData = await fsPromises.readFile(
      filePath,
      !contentType.includes("image") ? "utf-8" : ""
    );
    const data =
      contentType === "application/json" ? JSON.parse(rawData) : rawData;
    response.writeHead(filePath.includes("404.html") ? 404 : 200, {
      "Content-Type": contentType,
    });
    response.end(
      contentType === "application/json" ? JSON.stringify(data) : data
    );
  } catch (err) {
    console.log(err);
    myEmitter.emit("log", `${err.name}\t ${req.method}`, "reqLog.txt");
    response.statusCode = 500;
    res.end();
  }
};

// example 2
const server = http.createServer((req, res) => {
  console.log(req.url, req.method);
  myEmitter.emit("log", `${req.url}: ${req.message}`, "errLog.txt");

  // res.end("Hello Sahar"); // open the page

  // let path2;

  // if (req.url === "/" || req.url === "index.html") {
  //   res.statusCode = 200;
  //   res.setHeader("content-Type", "text/html");
  //   path2 = path.join(__dirname, "views", "index.html");
  //   fs.readFile(path2, "utf8", (err, data) => {
  //     res.end(data);
  //   });
  // }

  const extension = path.extname(req.url);
  let contentType;

  switch (extension) {
    case ".css":
      contentType = "text/css";
      break;
    case ".js":
      contentType = "text/javascript";
      break;
    case ".json":
      contentType = "application/json";
      break;
    case ".jpg":
      contentType = "image/jpeg";
      break;
    case ".png":
      contentType = "image/png";
      break;
    case ".txt":
      contentType = "txt/plain";
      break;
    default:
      contentType = "text/html";
  }

  let filePath =
    contentType === "text/html" && req.url === "/"
      ? path.join(__dirname, "views", "index.html")
      : contentType === "text/html" && req.url.slice(-1) === "/"
      ? path.join(__dirname, "views", req.url, "index.html")
      : contentType === "text/html"
      ? path.join(__dirname, "views", req.url)
      : path.join(__dirname, req.url);

  if (!extension && req.url.slice(-1) !== "/") {
    filePath += ".html";
  }

  const fileExist = fs.existsSync(filePath);

  if (fileExist) {
    serveFile(filePath, contentType, res);
  } else {
    //404
    //301 redirect
    switch (path.parse(filePath).base) {
      case "old-page.html":
        res.writeHead(301, { Location: "/new-page.html" });
        res.end();
        break;
      case "www.page.html":
        res.writeHead(301, { Location: "/" });
        res.end();
        break;
      default:
        //404 serve
        serveFile(path.join(__dirname, "views", "404.html"), "text/html", res);
    }
  }
});

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
