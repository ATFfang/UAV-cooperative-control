from flask import Flask, Response, request, jsonify, stream_with_context
import time
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True)

global sendmessage
sendmessage = 0

# SSE 生成器函数
def generate_json():
    while True:
        # 创建要发送的JSON数据
        global sendmessage
        data = {"message": f"Hello, this is your data: {sendmessage}, now:" + str(time.time())}
        # 将数据转换为SSE格式，并每0.5秒发送一次
        yield f"data: {json.dumps(data)}\n\n"
        time.sleep(0.1)

@app.route('/stream')
def stream():
    # 使用SSE流传输数据
    return Response(generate_json(), mimetype='text/event-stream')

@app.route('/streamjson')
def streamjson():
    timestep = request.args.get('timestep', default=0.2)
    timestep = float(timestep)
    def generate(timestep):
        while True:
            jsondata = {
                "id": 1,
                "timestamp": time.time(),
                "baseinfo": {
                    "Dradius": 100.0,
                    "CAradius": 50.0,
                    "maxspeed": 120.0,
                    "maxturnrate": 30.0
                },
                "geometry": {
                    "x": 10.5,
                    "y": 20.3,
                    "z": 5.0
                },
                "target": {
                    "targetx": 100.5,
                    "targety": 150.0,
                    "targetz": 20.0
                },
                "statusinfo": {
                    "speed": 80.0,
                    "turnrate": 25.0,
                    "ifarrival": 0
                }
            }
            # 使用SSE格式流传输数据
            yield f"data: {json.dumps(jsondata)}\n\n"
            time.sleep(timestep)  # 模拟数据间隔

    return Response(stream_with_context(generate(timestep)), content_type='text/event-stream')

# 定义一个路由，接收 POST 请求的 JSON 数据
@app.route('/endpoint', methods=['POST'])
def receive_data():
    # 获取前端发送的 JSON 数据
    data = request.get_json()

    global sendmessage
    sendmessage = data["message"]

    # 返回响应
    return jsonify({'message': 'Data received successfully!'})

if __name__ == '__main__':
    app.run(debug=True)
