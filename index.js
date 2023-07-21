require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");

const app = express();
mongoose.set('strictQuery', false);



app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));


//it is possible to add elements in const array, but cant reassign to a new elemenet array

app.set('view engine', 'ejs');

mongoose.connect(process.env.MONGO_URI);
const itemsSchema={
    name:String
};
//(singularCollectionName, Schema name)
const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
    name:"Welcome to your todoList!"
});

const item2=new Item({
    name:"Hit the + button to add a new item."
});

const item3=new Item({
    name:"<-- Hit this to delete an item."
});

const defaultItems=[item1,item2,item3];
const listSchema={
    name:String,
    items: [itemsSchema]
}

const List=mongoose.model("List",listSchema);



app.get("/", function (req, res) {

    Item.find({},function(err,foundItems){
            
            if(foundItems.length===0){

                Item.insertMany(defaultItems,function(err){
                    if(err){
                        console.log(err);
                    }else{
                    console.log("Successfully saved default items");
                    }
                })
                //after saving items , if we go to root route , now the defaultItems length is not 0
                //so else block will get executed
                res.redirect("/");
            }
            res.render("list", { listTitle: "Today", newItems: foundItems });
        }
    );
    
});

app.post("/", (req, res) => {
    const itemName = req.body.newitem;
    const listName = req.body.list;
    // console.log(req.body);

    const userItem=new Item({
        name:itemName
    });

    if(listName==="Today"){
        userItem.save();
        res.redirect("/");
    }else{
        List.findOne({name:listName},function(err,foundList){
                foundList.items.push(userItem);
                foundList.save();
                res.redirect("/"+foundList.name);

        })
    }
    
})


app.get("/:customListName",(req,res)=>{
    const customListName=_.capitalize(req.params.customListName);
    //findOne will return an object, find returns an array
    List.findOne({name:customListName},function(err,foundList){
        if(!err){
            if(!foundList){
                //create new list
                const list=new List({
                    name:customListName,
                    items:defaultItems
                });
                list.save();
                res.redirect("/"+customListName);
            }else{
                //show existing list
                res.render("list", { listTitle: foundList.name, newItems: foundList.items });
            }
        }
    })
   
});
 

//we need 2 things- the id of item we wanna delete, and the list from which we wanna delete
app.post("/delete",(req,res) =>{
    const checkItemId=req.body.check;
    const listName=req.body.listName;

    if(listName==="Today"){
        //callback is necessary,else won't be deleted
        Item.findByIdAndDelete(checkItemId,function(err){
        if(!err){
            console.log("successfully deleted checked item");
            res.redirect("/");
        }
    });
    }else{
        List.findOneAndUpdate({name:listName},{$pull:{items:{_id:checkItemId}}},function(err,foundList){
            if(!err){
                res.redirect("/"+listName);
            }
        })
    }

    
});



app.get("/about",(req,res)=>{
    res.render("about");
});



app.listen(3000, function () {
    console.log("Server started on port 3000.");
});
