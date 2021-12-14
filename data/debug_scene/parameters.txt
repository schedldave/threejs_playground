A debug scene rendered in Blender. 
The scene has objects at z coordinates (away from the camera) -4, -9, and -15 units. 
The camera is at the origin and points towards -z in frame 000.
In the following frames, the camera moves +0.2 units per frame to the right (in positive x-axis).
Thus in frame 10 it is at x position 2.0 (z and y are 0).

The rendering resolution was 512 pixels horizontally and vertically and the field of view was set to 60° in Blender.

If you want to use the scene with the LFR application [https://github.com/schedldave/AOS] you can start it with:
```
LFR.exe --fov 60 --pose ".\data\debug_scene\poses.json" --img .\data\debug_scene\  -z 9
```