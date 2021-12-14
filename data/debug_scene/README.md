A debug scene rendered in Blender. 
The scene has objects at z coordinates (away from the camera) -4, -9, and -15 units. 
The camera is at the origin and points towards -z in frame 000.
In the following frames, the camera moves +0.2 units per frame to the right (in positive x-axis).
Thus in frame 10 it is at x position 2.0 (z and y are 0).

Furthermore, additional images with rotations and translations are rendered. 
For a list of camera positions and rotations (XYZ Euler in Blender) see below.

| image    | x   | y  | z | rotX | rotY | rotZ |
| -------- | --- | -- | - | ---- | ---- | ---- |
| 0000.png | 0   | 0  | 0 | 0    | 0    | 0    |
| 0001.png | 0.2 | 0  | 0 | 0    | 0    | 0    |
| 0002.png | 0.4 | 0  | 0 | 0    | 0    | 0    |
| 0003.png | 0.6 | 0  | 0 | 0    | 0    | 0    |
| 0004.png | 0.8 | 0  | 0 | 0    | 0    | 0    |
| 0005.png | 1   | 0  | 0 | 0    | 0    | 0    |
| 0006.png | 1.2 | 0  | 0 | 0    | 0    | 0    |
| 0007.png | 1.4 | 0  | 0 | 0    | 0    | 0    |
| 0008.png | 1.6 | 0  | 0 | 0    | 0    | 0    |
| 0009.png | 1.8 | 0  | 0 | 0    | 0    | 0    |
| 0010.png | 2   | 0  | 0 | 0    | 0    | 0    |
| 0011.png | 0   | 0  | 0 | 0    | -15  | 0    |
| 0012.png | 0   | 1  | 0 | 0    | -15  | 0    |
| 0013.png | 1   | 1  | 0 | -15  | 0    | 0    |
| 0014.png | 1   | -1 | 1 | 15   | 0    | 0    |
| 0015.png | 1   | -1 | 1 | 0    | 0    | 0    |
| 0016.png | 0   | 0  | 0 | 0    | 0    | 60   |
| 0017.png | 3   | -2 | 1 | 10   | 20   | 30   |

The rendering resolution was 512 pixels horizontally and vertically and the field of view was set to 60° in Blender.

If you want to use the scene with the LFR application [https://github.com/schedldave/AOS] you can start it with:
```
LFR.exe --fov 60 --pose ".\data\debug_scene\poses.json" --img .\data\debug_scene\  -z 9
```
or
```
LFR.exe --fov 60 --pose ".\data\debug_scene\blender_poses.json" --img .\data\debug_scene\  -z 9 --dem ./data/zero_plane.obj
```

In the json files used with `LFR` the y and z coordinates need to be inverted in the matrices (both in the rotation and translational part). 
The coordinate system is defined such that east point towards the right (x-axis) and north points downwards (negative y-axis). The negative altitude is used as z-coordinate.