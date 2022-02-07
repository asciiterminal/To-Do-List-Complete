//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose"); //Integration of mongoose
const _ = require("lodash");


const app = express();


const items = ["Buy Food", "Cook Food", "Eat Food"];

const workItems = [];


app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {
  useNewUrlParser: true
});
//connecting to mongoose.

const itemsSchema = { //Items Schema.

  name: String

};

const Item = mongoose.model("Item", itemsSchema); //mongoose model consts should begin with uppercase.

const item1 = new Item({

  name: "Welcome to your todolist!"

});

const item2 = new Item({

  name: "Press the + Button to add a new item."

});

const item3 = new Item({

  name: "<---- Press this to delete an item."

});

const defaultItems = [item1, item2, item3];

const listSchema = {

  name: String,
  items: [itemsSchema] //This will have an array of docs.

};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {



  Item.find({}, function(err, foundItems) { //We will process the items list
    //into the root directory.In the {Item.find()}, what ever information
    //it finds will be triggering the {foundItems} callback and will
    //insert data into {newListItems}.
    if (foundItems.length === 0) {

      Item.insertMany(defaultItems, function(err) {

        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved default items to the Database.");
        }

      });

      res.redirect("/");

    } else {

      res.render("list", {
        listTitle: "Today",
        newListItems: foundItems
      });


    }


  });



});


app.get("/:customListName", function(req, res) {
  //We are creating a dynamic custom route pages for different Lists as we wish
  //to create.
  const customListName = _.capitalize(req.params.customListName);
  //By using this we will be able to avoid the route spelling mistake
  //that causes us to land on different pages due to the system
  //seeing upper and lower case mistakes as a logic decision.
  //If you write Home or home you should be on the same page rather than
  //two different pages.

  List.findOne({
    name: customListName
  }, function(err, foundList) {

    if (!err) {
      if (!foundList) {
        //Create a new list
        const list = new List({

          name: customListName,
          items: defaultItems

        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items
        })
      }


    }

  });



});

app.post("/", function(req, res) {

  let itemName = req.body.newItem;
  let listName = req.body.list; //As we enter an entry into any dynamic page
  //we get sent back to the root page {"/"},by doing this and also adding
  //button value as {value=<%= listTitle %>} in the {.ejs} file we get to enter data in the current page
  //we dynamically created from the customListName url we are able to retain information on the relevant pages.
  const item = new Item({
    name: itemName
  });
  if (listName === "Today") { // If the entry was made from root page.
    item.save(); //Instead of {insertMany()}
    res.redirect("/"); //redirects to the home route
    //and shows the data inserted on screen.
  } else {
    List.findOne({
      name: listName
    }, function(err, foundList) { //If the entry
      //is being made from custom list.

      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listName); //The entered data appears on the created list page and not the home/root page/route.
    });

  }
});

app.post("/delete", function(req, res) {

  const checkItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {

    Item.findByIdAndRemove(checkItemId, function(err) {

      if (!err) {
        console.log("Successfully deleted checked item.");
        res.redirect("/");
      }

    });

  } else {
    //Here we will proceed to combine Mongo and Mongoose scripts
    //and help the program to "actually" delete an item from the entry
    //rather than just looping us back to the home/root page
    //making it look like the item has been removed.This happens because
    //of a logical error that we are unable to retract the base function
    //so to achieve this we have to combine tools in order to succeed.
    List.findOneAndUpdate({
      name: listName
    }, {
      $pull: {
        items: {
          _id: checkItemId
        }
      }
    }, function(err, foundList) {

      if (!err) {
        res.redirect("/" + listName);
      }

    });


  }



});



app.get("/work", function(req, res) {

  res.render("list", {
    listTitle: "Work List",
    newListItems: workItems
  });

});

app.get("/about", function(req, res) {

  res.render("about");

})

app.listen(3000, function() {

  console.log("Server is up on port 3000");

});
