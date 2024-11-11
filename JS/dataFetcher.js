// 无人机类
class Drone {
    constructor(id, x, y, z) {
        this.x = x; // X坐标
        this.y = y; // Y坐标
        this.z = z; // Z坐标
        this.droneobject = null;
        this.id = id
        this.targetX = 0;
        this.targetY = 0;
        this.targetZ = 0;
        this.nextX = [];
        this.nextY = [];
        this.nextZ = [];
        this.shining = false;
        this.Dradius = 0.2;
        this.CAradius = 10;
        this.maxspeed = 10;
        this.maxturnrate = 20;
        this.speed = 0;
        this.turnrate = 0;
        this.ifarrival = 0;
    }

    enqueue(x, y, z) {
        this.nextX.push(x);
        this.nextY.push(y);
        this.nextZ.push(z);
    }

    dequeue() {
        if (this.isEmpty()) {
            return null;
        }

        const x = this.nextX.shift();
        const y = this.nextY.shift();
        const z = this.nextZ.shift();
        return { x, y, z };
    }

    isEmpty() {
        return this.nextX.length === 0 && this.nextY.length === 0 && this.nextZ.length === 0;
    }

    size() {
        return Math.min(this.nextX.length, this.nextY.length, this.nextZ.length);
    }
}

const TotalAPI = 'http://192.168.41.166:5000/';


// 获取指引无人机飞行位置的流json数据
function fetchJSONData_Moveto(drones) {
    api = TotalAPI + `streamjson`;
    const eventSource = new EventSource(api);
    let ifarrival = 0;

    drones.forEach(value => {
        value.nextX = [];
        value.nextY = [];
        value.nextZ = [];
    });

    return new Promise((resolve, reject) => {
        eventSource.onmessage = function (event) {
            // 将数据解析为JSON
            const data = JSON.parse(event.data);
            console.log(data);
            // drones.forEach(value => {
            //     const record = data.find(item => item.id === value.id);
            //     value.enqueue(record.nextstep.nx, record.nextstep.ny, record.nextstep.nz);
            //     ifarrival += record.statusinfo.ifarrival;
            // });

            // // 检查 ifarrival 是否等于无人机数量
            // if (ifarrival === drones.length) {
            //     // 停止事件流
            //     eventSource.close();
            //     // 解析 Promise，表示所有无人机到达
            //     resolve("All drones have arrived");
            //     console.log("All drones have arrived")
            // }
        };

        // eventSource.onerror = function (err) {
        //     // 处理错误情况并拒绝 Promise
        //     eventSource.close();
        //     reject("Error occurred in fetching data");
        // };
    });
}

// post无人机状态json至后端
function postJSONData(droneclassdict) {
    api = TotalAPI + `endpoint`;
    
    // console.log(JSON.stringify({ message: constructionJSONData(droneclassdict) }))
    
    fetch(api, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: constructionJSONData(droneclassdict) })  // 将消息封装为JSON
    })
        .then(response => response.json())
        .then(data => {
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// Drone -> json构建函数
function constructionJSONData(droneclassdict) {
    const dronejsonarray = [];
    const dronelist = Object.values(droneclassdict)
    dronelist.forEach(drone => {
        let dronejsonobject = {
            "id": drone.id,
            "timestamp": new Date().toISOString(),
            "baseinfo": {
                "Dradius": drone.Dradius,
                "CAradius": drone.CAradius,
                "maxspeed": drone.maxspeed,
                "maxturnrate": drone.maxturnrate
            },
            "geometry": {
                "x": drone.x,
                "y": drone.y,
                "z": drone.z
            },
            "target":{
                "targetx": drone.targetX,
                "targety": drone.targetY,
                "targetz": drone.targetZ
            },
            "statusinfo": {
                "speed": drone.speed,
                "turnrate": drone.turnrate,
                "ifarrival": drone.ifarrival
            }
        }

        dronejsonarray.push(dronejsonobject)
    });

    const jsonString = JSON.stringify(dronejsonarray);
    return jsonString;
}

// json -> Drone解构函数
function deconstructionJSONData(json, droneclassdict) {
    json.forEach(dronejsonobject => {
        let drone = droneclassdict[dronejsonobject.id];

        drone.nextx = dronejsonobject.nextstep.nx;
        drone.nexty = dronejsonobject.nextstep.ny;
        drone.nextz = dronejsonobject.nextstep.nz;
        
        drone.speed = dronejsonobject.statusinfo.speed;
        drone.turnrate = dronejsonobject.statusinfo.turnrate;
        drone.ifarrival = dronejsonobject.statusinfo.ifarrival;
    })
}