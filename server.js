const express = require('express');
const bodyParser = require('body-parser');
const async = require("async");

const { Pool, Client } = require("pg");
var cors = require('cors')
var moment = require('moment');
const app = express();
const port = process.env.PORT || 5000;


app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cors());

app.get('/api/hello', (req, res) => {
  res.send({ express: 'Hello From Express' });
});

const pool = new Pool({
  user: 'sportsdb',
  host: 'database-2.c1urom12otsm.ap-south-1.rds.amazonaws.com',
  database: 'sports-stock',
  password: 'sports0265',
  port: 5432,
});

app.post('/api/insert_order', (req, resp) => {
  console.log(req.body.neworder);
  var mysqlTimestamp = moment().format('MMMM Do YYYY, h:mm:ss a');

  pool.query(
    `INSERT INTO sportstab.order_table
    (user_id, player_id, order_type, order_side, price, quantity, order_time, order_status, order_filled_quantity)    
    VALUES(${parseInt(req.body.neworder.UserId,10)}, 
    ${parseInt(req.body.neworder.PlayerID,10)}, 
    '${req.body.neworder.Order_Type}',
    '${req.body.neworder.Order_Side}',
    '${req.body.neworder.Price}',
    ${parseInt(req.body.neworder.Quantity,10)},
    '${mysqlTimestamp.toString()}',
    'Processing','0');`
    ,


    (err, res) => {
      console.log(err);
      if(err === undefined)
      {
        resp.send('Success');
        buy_sell_count();

    }
      else
      {
        resp.send('an error occured while inserting');
      }
    }
  )

});


async function buy_sell_count() {
  var buy_count;
  var sell_count;
  pool.query(
    `SELECT count(*) 
    FROM sportstab.order_table where order_status='Processing' and order_side='Sell';`
    ,


    (err, res) => {
      console.log('error 1 ' + err);
      if (err === undefined) {
        buy_count = res.rows[0].count;
        pool.query(
          `SELECT count(*) 
          FROM sportstab.order_table where order_status='Processing' and order_side='Buy';`
          ,


          (err, res) => {
            console.log('err 2');
            if (err === undefined) {
              sell_count = res.rows[0].count;
              var b = buy_count;
              
                if (buy_count != 0 || sell_count != 0) {
                  pool.query(
                    `select player_id ,price ,quantity,order_id 
                    FROM sportstab.order_table where order_status='Processing' and order_side='Buy' order by order_id; `,
                    (err, res) => {
                      console.log(err);
                      if (err == undefined) {
                        console.log(res.rows[0]);
                        for(var i=0;i<res.rows.length;i++)
                        {
                         var con= main_logic_buy_sell(res.rows[i].player_id,res.rows[i].price,res.rows[i].quantity,res.rows[i].order_id)
                    
                        }
                      }
                    }
                  ) 
                }
                 


              }
            
            else {

              resp.send('an error occured while inserting');
            }
          }
        )
      }
      else {

        resp.send('an error occured while inserting');
      }
    }
  )




}
function update_query_without_qty( order_id) {
  pool.query(
    `UPDATE sportstab.order_table
    SET order_status='Confirmed'
    WHERE order_id=${order_id};
    `,
    (err, res) => {
      console.log(err);
      if (err == undefined) {
      
      }
    }
  )
}
function update_query_with_qty(order_id,qty) {
  pool.query(
    `UPDATE sportstab.order_table
    SET quantity=${qty}
    WHERE order_id=${order_id};
    `,
    (err, res) => {
      console.log(err);
      if (err == undefined) {
      
      }
    }
  )
}

function main_logic_buy_sell(player_id, price, quantity, order_id) {
  //code here
  pool.query(
    `SELECT order_id,price,player_id,quantity 
  FROM sportstab.order_table where order_status='Processing' and order_side='Sell' and player_id =${player_id} and price<=${price} order by order_id;`
    ,
    (err, res) => {
      if (err === undefined) {
        console.log(order_id);
  
        var curr_qty_buyer = 0;
        var curr_qty_seller = quantity;
        for (var i = 0; i < res.rows.length; i++) {
          curr_qty_seller = curr_qty_seller - res.rows[i].quantity;
          curr_qty_buyer = curr_qty_buyer + res.rows[i].quantity;
          if (curr_qty_seller == 0 || curr_qty_seller < 0) {
            if (curr_qty_seller < 0) {
              curr_qty_seller = Math.abs(curr_qty_seller);
              curr_qty_buyer = curr_qty_buyer - curr_qty_seller;
              
              if (curr_qty_buyer == quantity) {
                console.log('curr qty buyer ' + curr_qty_buyer);

                console.log('curr qty seller ' + curr_qty_seller);
                update_query_with_qty(res.rows[i].order_id,curr_qty_seller)
                update_query_without_qty(order_id);
                return 'done';
              }


            }
            else {
              console.log('curr qty buyer ' + curr_qty_buyer);

              console.log('curr qty seller ' + curr_qty_seller);
              update_query_without_qty(order_id);
              update_query_without_qty(res.rows[i].order_id);
                
              return 'done';
            }
            break;
          }
          update_query_without_qty(res.rows[i].order_id);

        }//loop completed


        if (curr_qty_seller > 0) {
          update_query_with_qty(order_id,curr_qty_seller);
          console.log('curr qty buyer ' + curr_qty_buyer);

          console.log('curr qty seller ' + curr_qty_seller);
          return 'done';
        }

      }
      else {
        resp.send('an error occured while inserting');
      }

    }
  )
}

app.post('/api/insert_users', (req, res) => {
  console.log(req.body);

  pool.query(
    "INSERT INTO sportstab.users(name,email,login_type,photo)VALUES('" + req.body.nm + "', '" + req.body.email + "','google' ,'" + req.body.url + "')",
    (err, res) => {
      console.log(err);

    }
  )
  // pool.query("SELECT * from sportstab.player_table", function(err, rows) {
  //   res.json(rows);

  // })
});

app.get('/api/get_player_price/', (req, res) => {
  console.log(req.body);

  pool.query(`SELECT 
  sportstab.player_table.playerid,
  sportstab.player_table.playername,
  sportstab.player_table.iconurl,
  sportstab.player_table.team,
  sportstab.player_table.playertype,
  (select array_to_json(array_agg(row_to_json(playerpricedata))) from (SELECT
  sportstab.player_price_day.openingprice,
  sportstab.player_price_day.closingprice,
  sportstab.player_price_day."day"
  from sportstab.player_price_day 
  where sportstab.player_price_day.playerid = sportstab.player_table.playerid and sportstab.player_price_day."day" > current_date - interval '7 days' order by sportstab.player_price_day."day") as playerpricedata) as ppagg
  FROM sportstab.player_table;`, function (err, rows) {
    res.json(rows['rows']);
  })
});
app.listen(port, () => console.log(`Listening on port ${port}`));