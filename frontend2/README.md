# Frontend 2

A very small network demo made with plain HTML, CSS and JavaScript.

Open `index.html` in a browser, then drag devices into the larger canvas.
Use the connection controls to connect two devices, and use `×` on a device to delete it.

The page uses the existing backend at `https://computer-network-br15.onrender.com/api`.
To use a local Flask server instead, open the browser console before loading the page and set:

```js
window.NETWORK_API_BASE = 'http://localhost:6050/api'
```

The routing simulator calls the backend BFS route and highlights the route on the canvas.
