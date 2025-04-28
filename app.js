//jshint esversion:6
require('dotenv').config()

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
// mongodb://localhost:27017
const mongourl = process.env.MONGO ;
console.log(mongourl);

mongoose.connect(`${mongourl}/todolistDB`);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

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

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);
const yearr = new Date().getFullYear();

app.get("/", async function (req, res) {
  const foundItems = await Item.find();
  console.log(foundItems);

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

app.listen(3000, function () {
  console.log("Server started on localhost:3000");
});
