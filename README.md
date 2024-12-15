# Project information

## Main strong points:
1. All objects represented in the "Yet Another Scene Format" (YASF) file have been successfully rendered using the parser;
2. Simple but effective 2D interface;
3. Several Level of Detail (LOD) and mipmaps implemented;
4. Lightweight scene;
5. Code structure that is easy to read and debug;

## Rendered Scene File:
The scene file used for testing this parser was made by [Rui Martins](https://github.com/RuiMartins2021).

The rendered scene represents an office furnished with:
- 1 table with:
	- 2 monitors (with running videos on the screen) and respective supports;
	- 1 keyboard;
- 1 wastebasket near the table, with 2 levels of LODs;
- 2 paintings of the students reimagined by ChatGPT with theme related to a game;
- 1 gaming chair with 3 levels of LODs;
- 1 bookshelf with 5 books with different textures applied;
- 1 carpet on the floor;
- 1 fan composed of several shapes attached to the roof;
- 1 moth represented by a sphere on its body and 2 polygons (BufferGeometry) as its wings.

The scene has several light options, which are all toggle-able in the 2D GUI, and it is possible to toggle the wireframe state of the materials in the GUI.

Several screenshots of the scene can be found in the relative link below:
- https://github.com/daniel-nunes-03/Scene-File-Parser-in-ThreeJS/tree/main/screenshots

The scene can be rendered with a local web server (in VSCode it could be an extension like "Live Server") by running the file described in the relative link below:
- https://github.com/daniel-nunes-03/Scene-File-Parser-in-ThreeJS/blob/main/index.html
