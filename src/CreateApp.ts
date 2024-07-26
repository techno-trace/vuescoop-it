import RoadToRideProvider from "./engine/RoadToRideProvider";
import TheRoadInstance from "./engine/TheRoad";
import CourseBringer from "./engine/CourseBringer";
import { courses } from "./HomingCourses";
import { exit } from "node:process";

export default async function go() {
  
  process.setMaxListeners(25);

  let theRoadInstance = new TheRoadInstance().start();

  try {

    await new RoadToRideProvider(theRoadInstance).startRiding();

    await new CourseBringer(theRoadInstance).findCoursesAndBringThemHome(courses);

  } catch (error) {

    if (error instanceof Error) {
    
      const stackLines = error.stack?.split("\n");
    
      console.error("Error:", error.message);
    
      console.error("Stack Trace:", stackLines?.[1].trim());
    }
  }
  exit();
}
