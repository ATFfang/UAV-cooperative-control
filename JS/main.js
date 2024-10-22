Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI4NmQzM2MzYS0zNzI5LTQxMjAtOGMyMy0xZmVlNDgyZjc1ZWIiLCJpZCI6MjQ3MDg3LCJpYXQiOjE3Mjg4OTQxOTJ9.5idQ6XkyZXH2qYSn04Ha-wgJBSsMNRcHN3T-3mcY5Po';
const viewer = new Cesium.Viewer("cesiumContainer", {
    animation: false,           // 关闭左下角的动画控件
    timeline: false,            // 关闭底部的时间轴
    fullscreenButton: false,    // 关闭全屏按钮
    vrButton: false,            // 关闭VR按钮
    geocoder: false,            // 关闭搜索控件
    homeButton: false,          // 关闭Home按钮
    infoBox: false,             // 关闭信息框
    sceneModePicker: false,     // 关闭视图模式切换控件
    selectionIndicator: false,  // 关闭选中指示器
    navigationHelpButton: false,// 关闭导航帮助按钮
    baseLayerPicker: true      // 关闭图层选择器
});

const viewer2 = new Cesium.Viewer("sideContainer_middle_map", {
    animation: false,           // 关闭左下角的动画控件
    timeline: false,            // 关闭底部的时间轴
    fullscreenButton: false,    // 关闭全屏按钮
    vrButton: false,            // 关闭VR按钮
    geocoder: false,            // 关闭搜索控件
    homeButton: false,          // 关闭Home按钮
    infoBox: false,             // 关闭信息框
    sceneModePicker: false,     // 关闭视图模式切换控件
    selectionIndicator: false,  // 关闭选中指示器
    navigationHelpButton: false,// 关闭导航帮助按钮
    baseLayerPicker: false      // 关闭图层选择器
});

viewer2.camera.setView({
    destination: Cesium.Cartesian3.fromDegrees(121.4737, 31.2304, 200), // 设置中心点（经度，纬度，高度）
    orientation: {
        heading: 0, // 方向角
        pitch: Cesium.Math.toRadians(-90), // 垂直向下
        roll: 0 // 旋转角
    }
});

//表格
const ctx = document.getElementById('myChart').getContext('2d');
const chart_config = {
    type: 'line',
    options: {
        scales: {
            x: {
                type: 'linear',
                position: 'bottom',
                ticks: {
                    display: false // 隐藏X轴标注
                }
            },
            y: {
                beginAtZero: true
            }
        },
        animation: {
            duration: 0 // 设置为0以实现即时更新
        },
        plugins: {
            legend: {
                display: false // 隐藏图例
            }
        }
    }
};
const myChart = new Chart(ctx, chart_config);


// 无人机类
class Drone {
    constructor(droneobject, id, x, y, z) {
        this.x = x; // X坐标
        this.y = y; // Y坐标
        this.z = z; // Z坐标
        this.droneobject = droneobject;
        this.path = null;
        this.id = id
        this.targetX = x;
        this.targetY = y;
        this.targetZ = z;
    }

    // 方法，计算与输入点之间的路径坐标点
    getPathTo(targetX, targetY, targetZ, numPoints = 10) {
        const path = []; // 用于存储路径坐标点

        // 计算增量
        const deltaX = (targetX - this.x) / numPoints;
        const deltaY = (targetY - this.y) / numPoints;
        const deltaZ = (targetZ - this.z) / numPoints;

        // 生成路径点
        for (let i = 0; i <= numPoints; i++) {
            const newX = this.x + deltaX * i;
            const newY = this.y + deltaY * i;
            const newZ = this.z + deltaZ * i;
            path.push({ x: newX, y: newY, z: newZ }); // 将新坐标点添加到路径中
        }

        return path; // 返回路径坐标点
    }
}

// 无人机列表
const droneclasslist = {};

// 添加无人机
document.getElementById('addButton').addEventListener('click', () => {
    fetch('..\\DATA\\Drone coordinates.json').then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    })
        .then(data => {
            data.forEach(item => {
                const position = Cesium.Cartesian3.fromDegrees(item.coordinates.x, item.coordinates.y, item.coordinates.z)

                //添加三维无人机点
                myBox = viewer.entities.add({
                    name: 'My 3D Box',
                    position: position,
                    box: {
                        dimensions: new Cesium.Cartesian3(1, 1, 0.2), // 盒子的尺寸
                        material: Cesium.Color.RED.withAlpha(0.5), // 透明红色
                    }
                });
                const drone = new Drone(myBox, item.id, item.coordinates.x, item.coordinates.y, item.coordinates.z);
                droneclasslist[item.id] = drone;

                //添加二维无人机点
                viewer2.entities.add({
                    position: Cesium.Cartesian3.fromDegrees(item.coordinates.x, item.coordinates.y), // 指定点的位置（经度，纬度）
                    point: {
                        pixelSize: 2, // 点的大小
                        color: Cesium.Color.RED // 点的颜色
                    }
                });

                // 添加无人机的侧边栏显示
                const newSquare = document.createElement('div');
                newSquare.classList.add('square');
                newSquare.textContent = item.id;
                document.getElementById('sideContainer_buttom_table').appendChild(newSquare);

                // 添加无人机侧边对象点击逻辑
                newSquare.addEventListener('click', function () {
                    const pic_container = document.getElementById('sideContainer_buttom_drone_picture');

                    // 设置背景图片
                    const imageUrl = 'https://raw.githubusercontent.com/ATFfang/publicWarehouse/main/drone.png';
                    fetch(imageUrl)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }
                            return response.blob(); // 将图片转换为 Blob 格式
                        })
                        .then(blob => {
                            const objectURL = URL.createObjectURL(blob);
                            pic_container.style.backgroundImage = `url(${objectURL})`;
                        })
                        .catch(error => {
                            console.error('There was a problem with the fetch operation:', error);
                        });

                    // 设置无人机信息
                    const richTextBox = document.getElementById('sideContainer_buttom_drone_richTextBox');
                    richTextBox.innerHTML = ''
                    richTextBox.innerHTML = `
                        <p>id: ${drone.id}</p>
                        <p>x: ${drone.x}</p>
                        <p>y: ${drone.y}</p>
                        <p>z: ${drone.z}</p>
                        `;

                    // 获取id
                    const inputIDField = document.getElementById('inputID');
                    inputIDField.value = `${drone.id}`;
                    const inputXField = document.getElementById('inputX');
                    const inputYField = document.getElementById('inputY');
                    const inputZField = document.getElementById('inputZ');
                    inputXField.value = `${drone.x}`;
                    inputYField.value = `${drone.y}`;
                    inputZField.value = `${drone.z}`;

                    // 设置无人机颜色
                    drone.droneobject.box.material = Cesium.Color.BLUE.withAlpha(0.5)
                });
            });
        })
    });

// 捕捉到无人机
document.getElementById('catchButton').addEventListener('click', () => {
    viewer.zoomTo(viewer.entities);
})

// 开始移动
document.getElementById('moveButton').addEventListener('click', () => {
    
    const values = Object.values(droneclasslist);
    values.forEach(value => {
        console.log(value); // 打印值
        const pathPoints = value.getPathTo(value.targetX, value.targetY, value.targetZ, 10);
        value.path = pathPoints;
    });

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms)); // 返回一个延迟的 Promise
    }

    async function moveDrone(drone) {
        return new Promise(async (resolve, reject) => {
            try {
                var dronepath = drone.path;
                // 使用 for...of 循环逐个更新无人机位置
                for (const pathpoint of dronepath) {
                    drone.droneobject.position = Cesium.Cartesian3.fromDegrees(pathpoint.x, pathpoint.y, pathpoint.z);
                    // console.log(drone.id + " has moved to " + pathpoint.x + ", " + pathpoint.y + ", " + pathpoint.z);

                    // 在小地图上绘制路径
                    var path = [Cesium.Cartesian3.fromDegrees(drone.x, drone.y),
                        Cesium.Cartesian3.fromDegrees(pathpoint.x, pathpoint.y)]
                    drawPath(path, viewer2)

                    // 再表上跟新高度
                    drawTable(pathpoint.z, drone.id, myChart)

                    // 更新位置
                    drone.x = pathpoint.x;
                    drone.y = pathpoint.y;
                    drone.z = pathpoint.z;
                    // 等待1秒（1000毫秒）再移动到下一个点
                    await delay(1000);
                }
                resolve(); // 成功时解决 Promise
            } catch (error) {
                reject(error); // 出现错误时拒绝 Promise
            }
        });
    }

    async function moveAllDrones(droneList) {
        await Promise.all(droneList.map(drone => moveDrone(drone)));
    }

    moveAllDrones(values);
});

// 创建降落面
document.getElementById('createlandsurfaceButton').addEventListener('click', () => {
    var landsurface_positions = Cesium.Cartesian3.fromDegreesArrayHeights([
        121.4746, 31.2304, 0, // 点1
        121.4747, 31.2305, 0, // 点2
        121.4748, 31.2304, 0, // 点3
        121.4747, 31.2303, 0  // 点4
    ]);

    var polygonGeometry = new Cesium.PolygonGeometry({
        polygonHierarchy: new Cesium.PolygonHierarchy(landsurface_positions),
        perPositionHeight: true,  // 使用每个点的高度值
    });

    // 创建外观并定义颜色
    var polygonInstance = new Cesium.GeometryInstance({
        geometry: Cesium.PolygonGeometry.createGeometry(polygonGeometry),
        attributes: {
            color: Cesium.ColorGeometryInstanceAttribute.fromColor(Cesium.Color.BLUE.withAlpha(0.2)),
        },
    });

    // 使用 primitive 来添加多边形
    viewer.scene.primitives.add(new Cesium.Primitive({
        geometryInstances: polygonInstance,
        appearance: new Cesium.PerInstanceColorAppearance({
            flat: true, // 不计算光照
        })
    }));
})

// 设置移动目标
document.getElementById('settargetButton').addEventListener('click', () => {
    const inputIDField = document.getElementById('inputID');
    const inputXField = document.getElementById('inputX');
    const inputYField = document.getElementById('inputY');
    const inputZField = document.getElementById('inputZ');

    droneclasslist[inputIDField.value].targetX = parseFloat(inputXField.value);
    droneclasslist[inputIDField.value].targetY = parseFloat(inputYField.value);
    droneclasslist[inputIDField.value].targetZ = parseFloat(inputZField.value);
    console.log(droneclasslist);
});

// 导入移动目标
document.getElementById('loadtargetButton').addEventListener('click', () => {
    fetch('..\\DATA\\dronetarget.json').then(response => {
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        return response.json();
    }).then(data => {
        data.forEach(item => {
            droneclasslist[item.id].targetX = item.coordinates.x;
            droneclasslist[item.id].targetY = item.coordinates.y;
            droneclasslist[item.id].targetZ = item.coordinates.z;
        })
    })
});

// 绘制移动路径
function drawPath(path, V) {
    V.entities.add({
        polyline: {
            positions: path,
            width: 2,
            material: Cesium.Color.RED // 路径颜色
        }
    });
}

// 绘制表格
function drawTable(height, label, chart) {
    const now = new Date();
    let dataset = chart.data.datasets.find(ds => ds.label === label);
    if (!dataset) {
        // 如果没有找到，创建一个新的数据集
        dataset = {
            label: label,
            borderColor: 'rgba(0, 123, 255, 1)', // 你可以为新数据集设置不同的颜色
            backgroundColor: 'rgba(0, 123, 255, 0.2)',
            data: [],
            fill: false,
        };
        chart.data.datasets.push(dataset); // 将新数据集添加到数据集中
    }
    // 将新数据点添加到数据集中
    dataset.data.push({ x: now, y: height });
    chart.update(); // 更新图表
}