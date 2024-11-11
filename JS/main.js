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
viewer.terrainProvider = Cesium.createWorldTerrain({
    requestVertexNormals: true, // 启用法线，用于光照效果
    requestWaterMask: true // 启用水面效果
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


// 当前访问的无人机id
var currentDroneId = 0;
// // 无人机类
// class Drone {
//     constructor(id, x, y, z) {
//         this.x = x; // X坐标
//         this.y = y; // Y坐标
//         this.z = z; // Z坐标
//         this.droneobject = null;
//         this.id = id
//         this.targetX = x;
//         this.targetY = y;
//         this.targetZ = z;
//         this.shining = false;
//         this.Dradius = 0.2;
//         this.CAradius = 10;
//         this.maxspeed = 10;
//         this.maxturnrate = 20;
//         this.speed = 0;
//         this.turnrate = 0;
//         this.ifarrival = 0;
//     }
// }

// 移动目标类
class MoveTarget {
    constructor(targetobject, id, x, y, z) {
        this.targetobject = targetobject;
        this.id = id;
        this.x = x;
        this.y = y;
        this.z = z;
    }
}

// 无人机列表
const droneclassdict = {};
// 移动目标列表
var moveTarget = null
const movetargetdict = {};

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
                const drone = new Drone(item.id, item.coordinates.x, item.coordinates.y, item.coordinates.z);

                //添加三维无人机点
                myBox = viewer.entities.add({
                    name: 'My 3D Box',
                    position: new Cesium.CallbackProperty(() => {
                        return Cesium.Cartesian3.fromDegrees(drone.x, drone.y, drone.z);
                    }, false),
                    model: {
                        uri: 'DATA\\drone.glb', // 指定本地 glb 模型的路径
                        minimumPixelSize: 64, // 模型的最小像素大小
                        maximumScale: 200, // 模型的最大缩放比例
                        color: Cesium.Color.RED.withAlpha(0.5) // 可选：为模型应用颜色和透明度
                    }
                });

                drone.droneobject = myBox;
                droneclassdict[item.id] = drone;

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
                    currentDroneId = drone.id

                    // 设置背景图片
                    const imageUrl = '..\\DATA\\drone.png';
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
                        <p style="margin: 0; line-height: 1;">id: ${drone.id}</p>
                        <p style="margin: 0; line-height: 1;">x: ${drone.x}</p>
                        <p style="margin: 0; line-height: 1;">y: ${drone.y}</p>
                        <p style="margin: 0; line-height: 1;">z: ${drone.z}</p>
                        `;
                });
            });
        })

    addText("完成添加无人机")
});

// 捕捉到无人机
document.getElementById('catchButton').addEventListener('click', () => {
    viewer.zoomTo(viewer.entities);
})

// 开始移动
document.getElementById('moveButton').addEventListener('click', () => {

    const values = Object.values(droneclassdict);

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

                    // 更新无人机状态栏
                    if (currentDroneId == drone.id) {
                        const richTextBox = document.getElementById('sideContainer_buttom_drone_richTextBox');
                        richTextBox.innerHTML = `
                            <p style="margin: 0; line-height: 1;">id: ${drone.id}</p>
                            <p style="margin: 0; line-height: 1;">x: ${drone.x.toFixed(4)}</p>
                            <p style="margin: 0; line-height: 1;">y: ${drone.y.toFixed(4)}</p>
                            <p style="margin: 0; line-height: 1;">z: ${drone.z.toFixed(4)}</p>
                            `;
                    }
                    // 等待1秒（1000毫秒）再移动到下一个点
                    await delay(500);
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
    addText("开始移动")

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

// // 设置移动目标
// document.getElementById('settargetButton').addEventListener('click', () => {
//     const inputXField = document.getElementById('inputX');
//     const inputYField = document.getElementById('inputY');
//     const inputZField = document.getElementById('inputZ');

//     droneclassdict[currentDroneId].targetX = parseFloat(inputXField.value);
//     droneclassdict[currentDroneId].targetY = parseFloat(inputYField.value);
//     droneclassdict[currentDroneId].targetZ = parseFloat(inputZField.value);
//     console.log(droneclassdict);
// });

// 导入移动目标
document.getElementById('loadtargetButton').addEventListener('click', () => {
    //打开对话框
    var endpointcontainer_maincontainer = document.getElementById("endpointcontainer_maincontainer");
    endpointcontainer_maincontainer.style.display = "block"
    var closeBtn = document.getElementById("close_endpointcontainer_maincontainer");
    closeBtn.onclick = function () {
        endpointcontainer_maincontainer.style.display = "none";
    }

    // fetch('..\\DATA\\dronetarget.json').then(response => {
    //     if (!response.ok) {
    //         throw new Error('Network response was not ok');
    //     }
    //     return response.json();
    // }).then(data => {
    //     data.forEach(item => {
    //         droneclassdict[item.id].targetX = item.coordinates.x;
    //         droneclassdict[item.id].targetY = item.coordinates.y;
    //         droneclassdict[item.id].targetZ = item.coordinates.z;
    //     })
    // })
});

// 绘制移动路径
function drawPath(path, V) {
    V.entities.add({
        polyline: {
            positions: path,
            width: 0.5,
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
            pointRadius: 2,
            borderWidth: 1,
        };
        chart.data.datasets.push(dataset); // 将新数据集添加到数据集中
    }
    // 将新数据点添加到数据集中
    dataset.data.push({ x: now, y: height });
    chart.update(); // 更新图表
}

// 设置降落终点
document.getElementById('createEndPointButton').addEventListener('click', () => {

    const endpoints = [];
    for (let i = 0; i < Object.keys(droneclassdict).length; i++) {
        // 随机生成x和y坐标在矩形范围内
        const x = Math.random() * (121.4748 - 121.4746) + 121.4746;
        const y = Math.random() * (31.2305 - 31.2303) + 31.2303;
        endpoints.push([x, y]);
    }

    var n = 0;
    // 将生成的坐标添加到drone类中
    const values = Object.values(droneclassdict);
    values.forEach(value => {
        value.targetX = endpoints[n][0]
        value.targetY = endpoints[n][1]
        value.targetZ = 0
        n++;
    });

    addText("终点已生成")
});

// 添加无人机运动目标点
document.getElementById('addtargetButton').addEventListener('click', () => {
    var handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
    var target = null;

    // 监听鼠标左键点击事件
    handler.setInputAction(function (click) {
        // 获取点击位置的屏幕坐标
        var pickedPosition = viewer.scene.pickPosition(click.position);

        if (Cesium.defined(pickedPosition)) {
            // 将屏幕坐标转换为地理坐标（经纬度和高度）
            var cartographic = Cesium.Ellipsoid.WGS84.cartesianToCartographic(pickedPosition);

            // 获取经度、纬度和高度
            var longitude = Cesium.Math.toDegrees(cartographic.longitude);
            var latitude = Cesium.Math.toDegrees(cartographic.latitude);
            var height = cartographic.height;

            // 输出坐标
            // console.log('经度:', longitude, '纬度:', latitude, '高度:', height);
            const position = Cesium.Cartesian3.fromDegrees(longitude, latitude, height)
            myTarget = viewer.entities.add({
                name: 'myTarget',
                position: position,
                ellipsoid: {
                    radii: new Cesium.Cartesian3(0.5, 0.5, 0.5), // 球体的半径（x, y, z）
                    material: Cesium.Color.YELLOW.withAlpha(0.5) // 初始颜色和透明度
                }
            });

            target = new MoveTarget(myTarget, 0, longitude, latitude, height)
            moveTarget = target;

            handler.removeInputAction(Cesium.ScreenSpaceEventType.LEFT_CLICK);
            addText("标定目标点");
        } else {
            addText("标定目标点无效");
        }
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK)

})

// 打印文字
function addText(text) {
    var txtcontainer = document.getElementById('sideContainer_buttom_buttom');
    txtcontainer.innerHTML += text + "<br>";
    txtcontainer.scrollTop = txtcontainer.scrollHeight;
}

//#region 无人机目标点移动

//x左移动目标点
var moveInterval;
document.getElementById("control-btn-left-x").addEventListener('mouseenter', function () {
    moveInterval = setInterval(function () {
        if (moveTarget != null) {
            // 执行目标对象的移动操作
            moveTarget.x += 0.000005;
            moveTarget.targetobject.position = Cesium.Cartesian3.fromDegrees(moveTarget.x, moveTarget.y, moveTarget.z);
        }
    }, 100);  // 每0.2秒执行一次
});
// 当鼠标离开按钮时停止移动
document.getElementById("control-btn-left-x").addEventListener('mouseleave', function () {
    clearInterval(moveInterval);  // 清除定时器
});

//x右移动目标点
var moveInterval;
document.getElementById("control-btn-right-x").addEventListener('mouseenter', function () {
    moveInterval = setInterval(function () {
        if (moveTarget != null) {
            // 执行目标对象的移动操作
            moveTarget.x -= 0.000005;
            moveTarget.targetobject.position = Cesium.Cartesian3.fromDegrees(moveTarget.x, moveTarget.y, moveTarget.z);
        }
    }, 100);  // 每0.2秒执行一次
});
// 当鼠标离开按钮时停止移动
document.getElementById("control-btn-right-x").addEventListener('mouseleave', function () {
    clearInterval(moveInterval);  // 清除定时器
});

//y左移动目标点
var moveInterval;
document.getElementById("control-btn-left-y").addEventListener('mouseenter', function () {
    moveInterval = setInterval(function () {
        if (moveTarget != null) {
            // 执行目标对象的移动操作
            moveTarget.y += 0.000005;
            moveTarget.targetobject.position = Cesium.Cartesian3.fromDegrees(moveTarget.x, moveTarget.y, moveTarget.z);
        }
    }, 100);  // 每0.2秒执行一次
});
// 当鼠标离开按钮时停止移动
document.getElementById("control-btn-left-y").addEventListener('mouseleave', function () {
    clearInterval(moveInterval);  // 清除定时器
});

//y右移动目标点
var moveInterval;
document.getElementById("control-btn-right-y").addEventListener('mouseenter', function () {
    moveInterval = setInterval(function () {
        if (moveTarget != null) {
            // 执行目标对象的移动操作
            moveTarget.y -= 0.000005;
            moveTarget.targetobject.position = Cesium.Cartesian3.fromDegrees(moveTarget.x, moveTarget.y, moveTarget.z);
        }
    }, 100);  // 每0.2秒执行一次
});
// 当鼠标离开按钮时停止移动
document.getElementById("control-btn-right-y").addEventListener('mouseleave', function () {
    clearInterval(moveInterval);  // 清除定时器
});

//z上移动目标点
var moveInterval;
document.getElementById("control-btn-up").addEventListener('mouseenter', function () {
    moveInterval = setInterval(function () {
        if (moveTarget != null) {
            // 执行目标对象的移动操作
            moveTarget.z += 0.5;
            moveTarget.targetobject.position = Cesium.Cartesian3.fromDegrees(moveTarget.x, moveTarget.y, moveTarget.z);
        }
    }, 100);  // 每0.2秒执行一次
});
// 当鼠标离开按钮时停止移动
document.getElementById("control-btn-up").addEventListener('mouseleave', function () {
    clearInterval(moveInterval);  // 清除定时器
});

//z下移动目标点
var moveInterval;
document.getElementById("control-btn-down").addEventListener('mouseenter', function () {
    moveInterval = setInterval(function () {
        if (moveTarget != null) {
            // 执行目标对象的移动操作
            moveTarget.z -= 0.5;
            if (moveTarget.z < 0) {
                moveTarget.z = 0;
            }
            moveTarget.targetobject.position = Cesium.Cartesian3.fromDegrees(moveTarget.x, moveTarget.y, moveTarget.z);
        }
    }, 100);  // 每0.2秒执行一次
});
// 当鼠标离开按钮时停止移动
document.getElementById("control-btn-down").addEventListener('mouseleave', function () {
    clearInterval(moveInterval);  // 清除定时器
});

//#endregion 无人机目标点移动

// 清除无人机运动目标点
document.getElementById('cleantargetButton').addEventListener('click', () => {
    viewer.entities.remove(moveTarget.targetobject);
    moveTarget = null

    const values = Object.values(droneclassdict);
})

// 开始移动
document.getElementById('movetotargetButton').addEventListener('click', () => {

    const values = Object.values(droneclassdict);

    // post无人机状态到后端
    postJSONData(values);

    addText("开始计算");

    // 创建用于移动无人机的函数
    function moveDroneonestep(drone, totalMoveTime) {
        const startX = drone.x;
        const startY = drone.y;
        const startZ = drone.z;
        let i = 0;

        const intervalID = setInterval(() => {
            t = i / totalMoveTime;

            const currentX = Cesium.Math.lerp(startX, drone.targetX, t);
            const currentY = Cesium.Math.lerp(startY, drone.targetY, t);
            const currentZ = Cesium.Math.lerp(startZ, drone.targetZ, t);

            // 在小地图上绘制路径
            var path = [Cesium.Cartesian3.fromDegrees(drone.x, drone.y),
            Cesium.Cartesian3.fromDegrees(currentX, currentY)]
            drawPath(path, viewer2)

            // 在主地图上修改位置
            drone.x = currentX;
            drone.y = currentY;
            drone.z = currentZ;

            // 在表上跟新高度
            drawTable(drone.z, drone.id, myChart)

            // 更新无人机状态栏
            if (currentDroneId == drone.id) {
                const richTextBox = document.getElementById('sideContainer_buttom_drone_richTextBox');
                richTextBox.innerHTML = `
                    <p style="margin: 0; line-height: 1;">id: ${drone.id}</p>
                    <p style="margin: 0; line-height: 1;">x: ${drone.x.toFixed(4)}</p>
                    <p style="margin: 0; line-height: 1;">y: ${drone.y.toFixed(4)}</p>
                    <p style="margin: 0; line-height: 1;">z: ${drone.z.toFixed(4)}</p>
                `;
            }

            i++;

            if (i > totalMoveTime) {
                clearInterval(intervalID); // 停止定时器
            }
        }, totalMoveTime);

    }


    async function moveDrone(drone, totalMoveTime) {
        return new Promise(async (resolve, reject) => {
            try {
                while (!drone.isEmpty()) {
                    // 出队一个值
                    const { x, y, z } = drone.dequeue();
        
                    drone.targetX = x;
                    drone.targetY = y;
                    drone.targetZ = z;
        
                    moveDroneonestep(drone, totalMoveTime);
                }

                resolve(); // 成功时解决 Promise
            } catch (error) {
                reject(error); // 出现错误时拒绝 Promise
            }
        });
    }

    fetchJSONData_Moveto(values).then(() => {
        // 当 fetchJSONData_Moveto 返回值后，执行下面的逻辑
        addText("开始移动");

        // 对所有无人机调用 moveDrone 函数
        Promise.all(values.map(drone => moveDrone(drone, 5)))
    }).catch((error) => {
        console.error("Error occurred:", error);
    });

});
