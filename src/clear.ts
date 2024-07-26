import fse from "fs-extra"
import rootPath from 'app-root-path'

async function deleteDirectory(dirPath: string) {
    try {
        if (await fse.pathExists(dirPath)) {
            await fse.remove(dirPath);
            console.info(`Directory '${dirPath}' has been deleted`);
        }
    } catch (err: any) {
        console.error(`Error while deleting '${dirPath}': ${err.message}`);
    }
}

["downloads", "logs", "chapters", "courses-json", "screenshots"].forEach((dirName) => deleteDirectory(`${rootPath.path}\\${dirName}`))

