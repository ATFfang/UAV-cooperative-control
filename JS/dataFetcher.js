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

const TotalAPI = 'http://127.0.0.1:5000/';


// 获取指引无人机飞行位置的流json数据
function fetchJSONData_Moveto(drones) {
    return new Promise((resolve, reject) => {
        const api = TotalAPI + `streamjson`;
        fetch(api)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(jsonData => {
                console.log('接收到的数据:', jsonData);
                jsonData.forEach(data => {
                    const id = data.id;
                    drones.forEach(drone => {
                        if (drone.id == id) {
                            for (let i = 0; i < data.path.nx.length; i++) {
                                drone.enqueue(data.path.nx[i], data.path.ny[i], data.path.nz[i]);
                            }
                        }
                    });
                });
                resolve();  // 在数据处理完后，标记完成
            })
            .catch(error => {
                console.error('获取数据失败:', error);
                reject(error);  // 如果有错误，返回失败状态
            });
    });
}


// post无人机状态json至后端
async function postJSONData(droneclassdict) {
    api = TotalAPI + `endpoint`;

    // 返回一个 Promise，以便在外部等待数据返回
    return fetch(api, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: constructionJSONData(droneclassdict) })  // 将消息封装为JSON
    })
    .then(response => {
        // 检查响应是否成功
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();  // 将响应解析为 JSON
    })
    .then(data => {
        console.log('POST 成功，返回的数据:', data);
        return data;  // 返回成功的数据，以便调用者使用
    })
    .catch(error => {
        console.error('Error:', error);
        throw error;  // 将错误抛出，以便调用者处理
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
            "target": {
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