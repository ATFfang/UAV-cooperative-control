from flask import Flask, Response
import time
import json
from flask_cors import CORS

app = Flask(__name__)
CORS(app, supports_credentials=True)

# SSE 生成器函数
def generate_json():
    while True:
        # 创建要发送的JSON数据
        data = {"message": "Hello, this is your data", "timestamp": time.time()}
        # 将数据转换为SSE格式，并每0.5秒发送一次
        yield f"data: {json.dumps(data)}\n\n"
        time.sleep(0.1)

@app.route('/stream')
def stream():
    # 使用SSE流传输数据
    return Response(generate_json(), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True)
