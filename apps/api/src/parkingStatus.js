/* parkingStatus file used for creating and updating the web page showing parking lot status.
  Desc: This will take the map and given data from SQL and change the parking lot color based on the 
  current fill of the parking lot at the given time.
  
  User Story: As a student I want to be able to see a visual reference of the current capacity 
  of the parking lot to easily judge the parking across campus. An example would be a map with 
  green, yellow, or red overlayed over the parking lots on campus.
*/

/*Lot
  Desc: Class that will be used to stroe the needed information after being pulled from database
  Variables:
    _id(int) : the private lot ID 
    name (string) : the name of the parking lot
    capacity(int) : the capacity of the lot
    fill(float) : the percent filled of lot
    color(array) : the color based on the current fill of the parking lot
  
*/
class Lot {
  constructor(lotId, lotName, lotCapacity, lotfill) {
    this._id = lotId;
    this.name = lotName;
    this.capacity = lotCapacity;
    this.fill = lotfill;
    //set color automatically
    this.color = this.setColor();
  }

  setColor() {
    // Assuming fill will be a number between 0 and 1
    //Red and green will be inversely proportional
    var red = 255 * this.fill;
    var green = 255 * (1 - this.fill);
    //set color of polygon for lot
    this.color = (red, 0, green);
  }
};

/*getLots()
Desc: This will collect the information that is needed from the SQL database and return the lots 
        in and array.
Params: none
Returns: lots(array) - will return the array of the lots with the needed information
*/
function getLots() {
  //Initialize
  let lots = {};
  //get data
  //Store as object with keyword pairs name:data


  return lots
}

function main() {
  /* To do
  - Need to make data read from database (SQL)
  - Need to make parking lot locations
  - Need to get status and update color on the leaflet display
  */

  //Initialize
  let lots = {};

  //get lots
  lots = getLots();

  //set color of lot polygon
  for (lot in lots) {
    lot.setColor();
  }

  //push to leaflet


}
/* To Do
 - Data base implementation
 - Special events closes parking lots
 - Sending back to the leaflet app


*/