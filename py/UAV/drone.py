import numpy as np
import time
import json
from pyproj import Proj,transform

# 定义三维向量，表示位置坐标及高度
def vec3(lon, lat, z):
    input_proj = Proj(init = 'epsg:4326')   #wgs84坐标
    output_proj = Proj(init = 'epsg:3857')  #web墨卡托投影坐标
    x,y = transform(input_proj,output_proj,lon,lat)
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
    def __init__(self, position, velocity=None, mass=400.0, max_speed=10.0, max_turn_rate=20, radius=0.2, repulsion_distance=1.0):
        self.position = position
        self.velocity = velocity if velocity is not None else vec3(0, 0, 0)
        self.mass = mass
        self.max_speed = max_speed
        self.max_turn_rate = max_turn_rate
        self.acceleration = vec3(0, 0, 0)
        self.radius = radius
        self.repulsion_distance = repulsion_distance
        self.path = []
        self.reached_target = False    # 是否到达目标点

    # 计算加速度
    def apply_force(self, force):
        self.acceleration = force / self.mass
    
    # 更新位置和速度信息
    def update(self, time_elapsed, target_position, others):
        if self.reached_target:
            self.velocity = vec3(0, 0, 0)
            return

        steering_force = self.seek(target_position)    # 目标吸引力
        repulsion_force = self.avoid_collision(others) # 个体排斥力
        total_force = steering_force + repulsion_force
        self.apply_force(total_force)

        # 更新速度和位置
        self.velocity += self.acceleration * time_elapsed
        self.velocity = truncate(self.velocity, self.max_speed)
        new_position = self.position + self.velocity * time_elapsed

        # 检查是否已到达目标
        if 0 < length(target_position - new_position) < 10.0:
            self.velocity = vec3(0, 0, 0)  # 速度清零
            self.reached_target = True

        # 更新位置并记录路径
        self.position = new_position
        input_proj = Proj(init='epsg:3857')  # 墨卡托投影
        output_proj = Proj(init='epsg:4326')  # WGS84地理坐标
        x,y = transform(input_proj,output_proj,self.position[0], self.position[1])
        self.path.append([x, y, self.position[2]])


    # 目标吸引力
    def seek(self, target_position, deceleration=0.1):
        desired_velocity = target_position - self.position
        distance_to_target = length(desired_velocity)

        if distance_to_target > 0:
            speed = distance_to_target / deceleration
            speed = min(speed, self.max_speed)
            desired_velocity = desired_velocity * (speed / distance_to_target)
            return limit_turn(desired_velocity - self.velocity, self.max_turn_rate)

        return vec3(0, 0, 0)
    
    # 无人机之间排斥力的计算
    def avoid_collision(self, others):
        min_repulsion_distance = self.repulsion_distance
        total_repulsion = vec3(0, 0, 0)
        
        for other in others:
            if other is self:
                continue
            
            direction_to_other = other.position - self.position
            distanceSQ = length(direction_to_other)
            
            if distanceSQ < (self.repulsion_distance if not self.reached_target else min_repulsion_distance) ** 2:
                distance = np.sqrt(distanceSQ)
                normalized_direction = normalize(direction_to_other)
                # 使用较小的排斥力系数，如果无人机已到达目标
                repulsion_strength = (100 if self.reached_target else 1000) / (distance ** 2 + 1)
                total_repulsion += -normalized_direction * repulsion_strength

        return total_repulsion

def simulate(input_json, time_step=1, steps=1000):
    
    data = json.loads(input_json)
 
    drones = []
    all_results = []  # 用于存储所有无人机的最终输出数据

    for drone_data in data:
        # 初始化无人机属性
        position = vec3(drone_data["geometry"]["x"], drone_data["geometry"]["y"], drone_data["geometry"]["z"])
        velocity = vec3(0, 0, 0)  # 初始化速度
        max_speed = drone_data["baseinfo"]["maxspeed"]
        max_turn_rate = drone_data["baseinfo"]["maxturnrate"]

        # 创建无人机实例并初始化输出结构
        drone = UAV(
            position=position,
            velocity=velocity,
            max_speed=max_speed,
            max_turn_rate=max_turn_rate,
            radius=drone_data["baseinfo"]["Dradius"],
            repulsion_distance=drone_data["baseinfo"]["CAradius"]
        )
        drones.append(drone)

        # 初始化输出数据结构
        all_results.append({
            "id": drone_data["id"],
            "time_interval": time_step,
            "statusinfo": {
                "speeds": [],  # 记录每一步的速度
                "ifarrival": 0  # 最终的到达状态
            },
            "path": {
                "nx": [],  # 记录每一步的x坐标
                "ny": [],  # 记录每一步的y坐标
                "nz": []   # 记录每一步的z坐标
            }
        })

    target_positions = [vec3(d["target"]["targetx"], d["target"]["targety"], d["target"]["targetz"]) for d in data]
    input_proj = Proj(init='epsg:3857')  # 墨卡托投影
    output_proj = Proj(init='epsg:4326')  # WGS84地理坐标

    for step in range(steps):
        for i, drone in enumerate(drones):
            drone.update(time_step, target_positions[i], drones)

            # 转换投影坐标到地理坐标
            lon, lat = transform(input_proj, output_proj, drone.position[0], drone.position[1])
            altitude = drone.position[2]

            # 记录每一步的数据
            all_results[i]["path"]["nx"].append(lon)
            all_results[i]["path"]["ny"].append(lat)
            all_results[i]["path"]["nz"].append(altitude)
            all_results[i]["statusinfo"]["speeds"].append(np.linalg.norm(drone.velocity))

            # 如果无人机到达目标，将到达标志设为1
            if drone.reached_target:
                all_results[i]["statusinfo"]["ifarrival"] = 1

    with open("output_all_steps.json", 'w') as output_file:
        json.dump(all_results, output_file, indent=2)
    return all_results

if "__name__" == "__main__":
    simulate("drones.json", time_step=0.5, steps=1000)