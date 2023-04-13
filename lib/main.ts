import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB } from "web-vitals";
export function startPPanel() {
  const paintHandle = (e) => {
    console.log("paintHandle", e);
  };
  onCLS(paintHandle);
  onFCP(paintHandle);
  onFID(paintHandle);
  onINP(paintHandle);
  onLCP(paintHandle);
  onTTFB(paintHandle);

  let id = "_performance_panel";
  if (document.getElementById(id)) {
    return;
  }
  let container = document.createElement("div");
  container.id = id;
  container.setAttribute(
    "style",
    "width: 250px; height: 420px; padding: 16px;background-color: #001529; position: fixed; left: 0; top: 0;cursor: pointer;box-shadow: 0px 0px 5px rgba(0,0,0,0.3);border-radius: 8px;"
  );
  container.innerHTML = `<canvas id="_fps_canvas" width="250" height="200" style="background-color: #001c36;margin-bottom:10px;border-radius: 8px;"></canvas>
    <canvas id="_memory_canvas" width="250" height="200" style="background-color: #001c36;border-radius: 8px;"></canvas>`;
  document.body.appendChild(container);

  let panel = document.getElementById("_performance_panel") as HTMLDivElement;
  var disX = 0;
  var disY = 0;
  panel.onmousedown = function (ev) {
    disX = ev.clientX - panel.offsetLeft;
    disY = ev.clientY - panel.offsetTop;
    document.onmousemove = function (ev) {
      panel.style.left = ev.clientX - disX + "px";
      panel.style.top = ev.clientY - disY + "px";
    };
    document.onmouseup = function () {
      document.onmousemove = null;
      document.onmouseup = null;
    };
  };

  let fpsCanvas = document.getElementById("_fps_canvas") as HTMLCanvasElement;
  let fpsCtx = fpsCanvas && fpsCanvas.getContext("2d");
  let memoryCanvas = document.getElementById(
    "_memory_canvas"
  ) as HTMLCanvasElement;
  let memoryCtx = memoryCanvas && memoryCanvas.getContext("2d");
  let fpsObj = {
    unit: "FPS",
    num: 50,
    max: 0,
    min: null,
    list: [],
    color: "22, 142, 225",
    canvas: fpsCanvas,
    ctx: fpsCtx,
  };
  let memoryObj = {
    unit: "MB",
    num: 50,
    max: 0, // performance.memory.jsHeapSizeLimit / 1048576,
    min: null,
    list: [],
    color: "137, 75, 202",
    canvas: memoryCanvas,
    ctx: memoryCtx,
  };
  if (!fpsCtx) {
    console.info("浏览器不支持canvas");
  } else {
    let lastTime = 0;
    let interVal = 120; // 监听间隔次数
    let intervalCount = 0; // 监听间隔计数(通过fps)

    // 获取性能数据
    let getPerformanceInfo = function () {
      intervalCount++;
      let nowTime = performance.now();
      // @ts-ignore
      let memory = performance.memory;
      if (intervalCount >= interVal) {
        let fps = Math.round((1000 * intervalCount) / (nowTime - lastTime));
        lastTime = nowTime;
        updateData(fps, fpsObj);
        const newMemory = Math.round(memory.usedJSHeapSize / 1048576);
        updateData(newMemory, memoryObj);
        intervalCount = 0;
        draw("fps");
        draw("memory");
      }
      window.requestAnimationFrame(getPerformanceInfo);
    };
    getPerformanceInfo();

    // 更新数据
    const updateData = (newData, obj) => {
      obj.list.push(newData);
      if (obj.list.length > obj.num) {
        obj.list.shift();
      }
      if (obj.max < newData) {
        obj.max = newData;
      }
      if (typeof obj.min !== "number") {
        obj.min = newData;
      } else {
        if (obj.min > newData) {
          obj.min = newData;
        }
      }
    };

    // 绘制canvas
    const draw = (type) => {
      const typeObj = {
        fps: fpsObj,
        memory: memoryObj,
      };
      const obj = typeObj[type];
      const { ctx, canvas, color } = obj;
      const text = `${obj.list[obj.list.length - 1] || 0} ${obj.unit}(${
        obj.min
      }-${obj.max}) `;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = "bold 20px serif";
      ctx.fillStyle = `rgba(${color},1)`;
      const textWidth = ctx.measureText(text).width;
      ctx.fillText(text, canvas.width - textWidth + 5, 24);

      // 绘制线
      ctx.moveTo(0, obj.list[0]);
      ctx.beginPath();
      const _max = obj.max + 50;
      for (let i = 0; i < obj.list.length; i++) {
        let x = i * 5;
        let y = _max - obj.list[i];
        ctx.lineTo(x, y);
      }
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#fff";
      ctx.shadowColor = `rgba(${color},1)`;
      ctx.shadowBlur = 5;
      ctx.stroke();
      ctx.shadowColor = "rgba(0,0,0,0)";

      // 绘制块
      ctx.moveTo(0, obj.list[0]);
      ctx.beginPath();
      for (let i = 0; i < obj.list.length; i++) {
        let x = i * 5;
        let y = _max - obj.list[i];
        ctx.lineTo(x, y);
        if (i === obj.list.length - 1) {
          ctx.lineTo(x, 200);
          ctx.lineTo(0, 200);
          ctx.lineTo(0, _max - obj.list[0]);
        }
      }
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(0,0,0,0)";
      ctx.stroke();
      const lg = ctx.createLinearGradient(0, 0, 0, 200);
      lg.addColorStop(0, `rgba(${color},0.5)`);
      lg.addColorStop(1, `rgba(${color},0)`);
      ctx.fillStyle = lg;
      ctx.fill();
    };
  }
}
