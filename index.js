//jshint esversion:6
require('dotenv').config()

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

// utills 

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
const path = require('path');
app.set('views', path.join(__dirname, 'views'));

// mongodb://localhost:27017
const mongourl = process.env.MONGO ;
// console.log(mongourl);
if (!mongourl) {
  console.error(`there are no mongourl`)
}

mongoose.connect(`${mongourl}/todolistDB`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("Connected to MongoDB successfully");
}).catch((err) => {
  console.error("MongoDB connection error:", err);
});
// mongodb schema

// item schema
const itemsSchema = {
  name: String,
};

//  list schema
const listSchema = {
  name: String,
  items: [itemsSchema],
};

// mongo models

// item model 
const Item = mongoose.model("Item", itemsSchema);


// list model 
const List = mongoose.model("List", listSchema);



const item1 = new Item({
  name: "Welcome to your todolist!",
});

const item2 = new Item({
  name: "Hit the + button to add a new item.",
});

const item3 = new Item({
  name: "<-- Hit this to delete an item.",
});

const defaultItems = [item1, item2, item3];

const yearr = new Date().getFullYear();

app.get("/", async function (req, res) {
  const foundItems = await Item.find();
  if (!foundItems) {
    
    await Item.insertMany(defaultItems);
    console.log("Succefully saved default items to DB");
  
    res.redirect("/");
  }
  // console.log(foundItems);

  if (foundItems.length === 0) {
    await Item.insertMany(defaultItems);
    console.log("Succefully saved default items to DB");

    res.redirect("/");
  } else {
    res.render("list", {
      listTitle: "Today",
      newListItems: foundItems,
      year: yearr,
    });
  }
});

app.get("/:customListName", async function (req, res) {
  const customListName = _.capitalize(req.params.customListName);

  const foundList = await List.findOne({ name: customListName });

  if (!foundList) {
    //Create a new list
    const list = new List({
      name: customListName,
      items: defaultItems,
    });
    list.save();
    res.redirect("/" + customListName);
  } else {
    //Show an existing list

    res.render("list", {
      listTitle: foundList.name,
      newListItems: foundList.items,
      year: yearr,
    });
  }
});

app.post("/", async function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    const foundList = await List.findOne({ name: listName });
    foundList.items.push(item);
    foundList.save();
    res.redirect("/" + listName);
  }
});

app.post("/delete", async function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    await Item.findByIdAndDelete(checkedItemId);
    console.log("Successfully deleted checked item.");
    res.redirect("/");
  } else {
    await List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } }
    );
    res.redirect("/" + listName);
  }
});

app.get("/about", function (req, res) {
  res.render("about");
});

// while testing/running in the local enviroment 
// use this 
// app.listen(3000, function () {
//   console.log("Server started on http://localhost:3000");
// });



//  use this when you run with vercel deployment 
if (require.main === module) {
  app.listen(3000, () => {
    console.log('Server started on http://localhost:3000');
  });
} else {
  module.exports = app;
}
