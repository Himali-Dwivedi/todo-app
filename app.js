// importing modules
require("dotenv").config(); 
const express = require("express");
const body_parser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const _ = require("lodash");

// importing project files
const date = require(__dirname + "/date.js");

const app = express();

app.set("view engine", "ejs");
app.use(body_parser.urlencoded({ extended: true }));
app.use(express.static("public"));

// connecting to the local DB
mongoose.connect(process.env.SERVER_URL, {useNewUrlParser: true});

//creating schema
const item_schema = new mongoose.Schema({
  name: {
    type: String,
    required: true 
  }
});

/*
  creating model: 
    Model takes two parameters:
      1) Name of the collection in the singular form
      2) name of the schema
*/
const Item = mongoose.model("Item", item_schema);

//inserting Data items
const item1 = new Item({
  name: "Welcome to the todo App"
});

const item2 = new Item({
  name: "Hit the + button to add new items to your todo list"
});

const item3 = new Item({
  name: "<-- Hit this to delete an item"
})

const default_items = [item1, item2, item3];


//  creating custom todo lists
const list_schema = mongoose.Schema({
  name: String,
  items: [item_schema]
});

const List = mongoose.model("List", list_schema);

app.listen(process.env.PORT || 3000, function (request, response) {
  console.log("Server is up and running at port 3000");
});



app.get("/", function (request, response) {
  var day = date.getDate();
  /* 
    This line of code is first going to look for the folder "view" 
    and for the file "list" with the file extention .ejs.

    If you don't have this folder or file in your project, 
    this code is not going to work
*/

//Reading data from the Database
  Item.find({}, function(error, found_items){
    if(found_items.length === 0){
      Item.insertMany(default_items, function(error){
        console.log("insertMany() error: " + error);
      });
      response.redirect("/");
    }else{
      response.render("list", { list_title: day, new_list_items: found_items });
    }

    if(error){
      console.log("find() error" + error);
    }
  });
});

// app.get("/work", function (request, response) {
//   response.render("list", {
//     list_title: "Work List",
//     new_list_items: work_tasks,
//   });
// });

app.get("/:customListName", function(request, response){
  const custom_list_name = _.capitalize(request.params.customListName);
  
  /*
    checking if the list name already exists in the collection
    using findOne() to check for any occurence of the list name 
  */

  List.findOne({name: custom_list_name}, function(error, found_list){
    if(!error){
      if(!found_list){
        //  create a new one
        const list = new List({
          name: custom_list_name,
          items: default_items
        });
      
        list.save();
        response.redirect("/" + custom_list_name);
      }else{
        //  show the existing list
        response.render("List", {list_title: found_list.name, new_list_items: found_list.items});
      }
    }
  });

});


app.get("/about", function (request, response) {
  response.render("about");
});

app.post("/", function (request, response) {
  const list_name = request.body.list;
  const item_name = request.body.task;

  const item = new Item({
    name: item_name
  });

  const day = (date.getDate()).split(" ");

  if(list_name == day[0]){
    item.save();
    response.redirect("/");
  }else{
    List.findOne({name: list_name}, function(error, found_result){
      found_result.items.push(item);
      found_result.save();
      response.redirect("/" + list_name);
    })
  }
});


app.post("/delete", function(request, response){
  const checked_item_id = request.body.is_task_done;
  const ListName = request.body.ListName;

  const day = date.getDate()

  if(ListName === day){
    Item.findByIdAndRemove(checked_item_id, function(error){
      console.log("findByIdAndRemove() error: " + error);
    });
    response.redirect("/"); 
  }else{
    List.findOneAndUpdate({name: ListName},{$pull: {items:{_id: checked_item_id}}}, function(error, found_list){
      if(!error){
        response.redirect("/" + ListName);
      }
    })
  }

});
