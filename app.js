//jshint esversion:6

//Required modules
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");


//Create app constant with Express
const app = express();

// Set view engine to EJS
app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));  //Use bodyParser to read the body
app.use(express.static("public"));  //use static function of Express to use static folder

// Create a database inside MongoDb
mongoose.connect("mongodb+srv://admin-YOUR_USERNAME:YOUR_PASSWORD@cluster0.aob4f.mongodb.net/todolistDB", {useNewUrlParser: true});

// Create a Mongoose Schema called Item
const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema); 

// Create Item documents
const item1 = new Item({
  name: "Welcome to your todolist!"
});

const item2 = new Item({
  name: "Hit the + button to add a new item."
});

const item3 = new Item({
  name: "<-- Hit this to delete an item."
});

// Store Item documents in defaultItems array
const defaultItems = [item1, item2, item3];


// Create a new Mongoose Schema called List
const listSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listSchema);


//Set up GET request using home route
app.get("/", function(req, res) {

  Item.find({}, function(err, foundItems){  // Find everything in foundItems

    if (foundItems.length === 0) {  // If foundItems is empty, then insert deafultItems
      Item.insertMany(defaultItems, function(err){
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to DB."); 
        }
      });
      res.redirect("/");  // Redirect to home page
    } else {  
      res.render("list", {listTitle: "Today", newListItems: foundItems});  // If foundItems is not empty, render list.ejs
    }
  });

});


//Set up GET request for custom list names
app.get("/:customListName", function(req, res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name: customListName}, function(err, foundList){
    if (!err){
      if (!foundList){
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      }
    }
  });



});

//Set up POST route to add new items to list
app.post("/", function(req, res){

  // Get values from body
  const itemName = req.body.newItem;
  const listName = req.body.list;

  // Create new Item object
  const item = new Item({
    name: itemName
  });

  if (listName === "Today"){
    item.save();
    res.redirect("/");  
  } else {
    List.findOne({name: listName}, function(err, foundList){
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName);
    });
  }
});


//Set up POST route to delete items from list
app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemId, function(err){
      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
      if (!err){
        res.redirect("/" + listName);
      }
    });
  }


});

// Set port as a dynamic port
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;  // if port is empty, port will equal 3000
}

app.listen(port, function() {
  console.log("Server started successfully");
});
