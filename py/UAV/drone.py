import numpy as np
import time
import json
import geopy

# 定义三维向量，表示位置坐标及高度
def vec3(x, y, z):
    return np.array([x, y, z], dtype=np.float64)

# 计算向量长度
def length(vec):
    return np.linalg.norm(vec)

# 计算单位向量向量
def normalize(vec):
    if length(vec) == 0:
        return vec
    return vec / length(vec)

# 限制向量的长度
def truncate(vec, max_value):
    if length(vec) > max_value:
        return normalize(vec) * max_value
    return vec

def limit_turn(steering, max_turn_rate):
    if length(steering) > max_turn_rate:
        return normalize(steering) * max_turn_rate
    return steering

# 定义无人机类
class UAV:
    def __init__(self, position, velocity=None, mass=400.0, max_speed=10.0, max_turn_rate=20, radius=0.2, repulsion_distance=10.0):
        self.position = position
        self.velocity = velocity if velocity is not None else vec3(0, 0, 0)
        self.mass = mass
        self.max_speed = max_speed
        self.max_turn_rate = max_turn_rate
        self.acceleration = vec3(0, 0, 0)
        self.radius = radius
        self.repulsion_distance = repulsion_distance
        self.path = [self.position]
        self.reached_target = False

    def apply_force(self, force):
        self.acceleration = force / self.mass

    def update(self, time_elapsed, target_position, others):
        if self.reached_target:
            self.velocity = vec3(0, 0, 0)
            return

        steering_force = self.seek(target_position)
        repulsion_force = self.avoid_collision(others)
        total_force = steering_force + repulsion_force
        self.apply_force(total_force)

        self.velocity += self.acceleration * time_elapsed
        self.velocity = truncate(self.velocity, self.max_speed)
        new_position = self.position + self.velocity * time_elapsed

        if length(target_position - new_position) < 50.0:
            self.velocity = vec3(0, 0, 0)
            self.reached_target = True

        self.position = new_position
        self.path.append(self.position.copy())

    def seek(self, target_position, deceleration=0.3):
        desired_velocity = target_position - self.position
        distance_to_target = length(desired_velocity)

        if distance_to_target > 0:
            speed = distance_to_target / deceleration
            speed = min(speed, self.max_speed)
            desired_velocity = desired_velocity * (speed / distance_to_target)
            return limit_turn(desired_velocity - self.velocity, self.max_turn_rate)

        return vec3(0, 0, 0)

    def avoid_collision(self, others):
        if self.reached_target:
            return vec3(0, 0, 0)

        total_repulsion = vec3(0, 0, 0)
        for other in others:
            if other is self:
                continue
            direction_to_other = other.position - self.position
            distanceSQ = length(direction_to_other)
            if distanceSQ > self.repulsion_distance ** 2:
                continue

            distance = np.sqrt(distanceSQ)
            normalized_direction = normalize(direction_to_other)
            repulsion_strength = 1000 / (distance ** 2 + 1)
            total_repulsion += -normalized_direction * repulsion_strength

        return total_repulsion
    
# 检测两架无人机之间的距离
def check_distances(drones, min_distance=10.0):
    for i in range(len(drones)):
        for j in range(i + 1, len(drones)):
            distance = np.linalg.norm(drones[i].position - drones[j].position)
            if distance < min_distance:
                print(f"Warning: Distance between UAV {i+1} and UAV {j+1} is {distance:.2f} meters, which is below the minimum distance of {min_distance} meters.")

# 定义UAV类和其他必要的函数（不变）

def simulate(input_json, time_step=1, steps=10):
    
    data = json.loads(input_json)

    print(type(data))    
    drones = []
    for drone_data in data:
        # 初始化无人机属性
        position = vec3(drone_data["geometry"]["x"], drone_data["geometry"]["y"], drone_data["geometry"]["z"])
        velocity = vec3(0, 0, 0)  # 初始化速度
        max_speed = drone_data["baseinfo"]["maxspeed"]
        max_turn_rate = drone_data["baseinfo"]["maxturnrate"]
        
        # 创建无人机实例
        drone = UAV(
            position=position,
            velocity=velocity,
            max_speed=max_speed,
            max_turn_rate=max_turn_rate,
            radius=drone_data["baseinfo"]["Dradius"],
            repulsion_distance=drone_data["baseinfo"]["CAradius"]
        )
        drones.append(drone)

    # 设定目标位置
    target_positions = [vec3(d["target"]["targetx"], d["target"]["targety"], d["target"]["targetz"]) for d in data]
    
    all_results = []
    for step in range(steps):
        result = []
        for i, drone in enumerate(drones):
            drone.update(time_step, target_positions[i], drones)
            drone_data = {
                "id": data[i]["id"],
                "timestamp": step + 1,  # 将timestamp设置为秒数
                "statusinfo": {
                    "speed": np.linalg.norm(drone.velocity),
                    "turnrate": drone.max_turn_rate,
                    "ifarrival": int(drone.reached_target)
                },
                "nextstep": {
                    "nx": drone.position[0],
                    "ny": drone.position[1],
                    "nz": drone.position[2]
                }
            }
            result.append(drone_data)

        all_results.append(result)

    return all_results

if "__name__" == "__main__":
    simulate("drones.json", time_step=1, steps=10)