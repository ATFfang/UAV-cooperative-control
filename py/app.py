from flask import Flask, Response, request, jsonify, stream_with_context
import time
import json
from flask_cors import CORS
import socket
from UAV import simulate

app = Flask(__name__)
CORS(app, supports_credentials=True)

global sendmessage
sendmessage = None


def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        # 不需要实际连接外部服务器，只需获取地址
        s.connect(("8.8.8.8", 80))  # 连接到 Google Public DNS
        local_ip = s.getsockname()[0]
    except Exception:
        local_ip = '127.0.0.1'  # 若获取失败，则使用回环地址
    finally:
        s.close()
    return local_ip

# SSE 生成器函数
def generate_json():
    # 创建要发送的JSON数据
    global sendmessage
    
    if(sendmessage):
        data_list = simulate(sendmessage)

        for data in data_list:
            yield f"data: {json.dumps(data)}\n\n"
            time.sleep(0.5)

    sendmessage = None
    return

@app.route('/stream')
def stream():
    # 使用SSE流传输数据
    return Response(generate_json(), mimetype='text/event-stream')

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

    app.run(host=get_local_ip(), port=5000, debug=True)
