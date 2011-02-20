var jsEngine = {};
golf.engine = jsEngine;

(function() {

jsEngine.setHole = setHole;
jsEngine.endHole = endHole;
jsEngine.startTurn = startTurn;
jsEngine.endTurn = endTurn;
jsEngine.swingClub = swingClub;

var intTimeMS = 50; // in ms
var intTimeSec = intTimeMS/1000; // in seconds

var curHoleNum;
var ball;
var bv={speed:0, dir:0};

var ballPath = [];
var lastKeyFrame = 0;
var keyFrameDelta = intTimeSec;
var curInterval = 0;
var intervalID = null;

var ballx, bally;
var x, y;
var dx, dy;

var TWOPI = 2 * Math.PI;

function setHole(holeNum)
{
  curHoleNum = holeNum;
}

function endHole()
{
}

function startTurn()
{
  // Start squirrels here if/when we enable squirrels in the pure web version?
}

function endTurn()
{
}

function swingClub(ballObj, clubspeed, clubdir)
{
  ball = ballObj;
  ballx = ball.getCenterX();
  bally = ball.getCenterY();
  bv.speed = clubspeed;
  bv.dir   = clubdir;
  bv.action = action.none;
  moveBall();
  curInterval = 0;
  if (intervalID != null) clearInterval(intervalID);
  intervalID = setInterval(ballInterval, intTimeMS);
      
}

function ballInterval()
{
  var lastFrame = ballPath.length - 1;
  if (curInterval < lastFrame)
  {
    var curPos = ballPath[curInterval];
    if (curPos.hide == true)
    {
      ball.inPipe();
    }
    else
    {
      ball.show();
    }
          positionBall(Math.round(curPos.left), Math.round(curPos.top));
    curInterval++;
  }
  else
  {
    if (intervalID != null) clearInterval(intervalID);
    switch (ballPath[lastFrame].action)
    {
      case action.splash:
        window.splash();
        break;
      case action.outOfBounds:
        window.outOfBounds();
        break;
      case action.score:
        window.score();
        break;
      default:
        window.miss();
        break;
    }
  }
}

function moveBall()
{
  ballPath = [];
  var ellapsedTime = 0;
  lastKeyFrame = 0;
    dx = Math.cos(bv.dir);
    dy = Math.sin(bv.dir);
  // TODO: Move 1 pixel at a time, but update time with
  // each pixel increment, until our time slot is up
  ballPath[ballPath.length] = { ts: 0, top: bally, left: ballx,  hide: bv.hidden };
  while (bv.speed > 0)
  {
    handleCollision();
    ellapsedTime += (1/bv.speed);
//    console.log("ellapsed: " + ellapsedTime);
    ballx = ballx + dx;
    bally = bally + dy;
    if (ellapsedTime > lastKeyFrame + keyFrameDelta)
    {
       lastKeyFrame = ellapsedTime;
       ballPath[ballPath.length] = { ts: ellapsedTime, top: bally, left: ballx, hide: bv.hidden, action: bv.action };
//      console.log("ellapsed: " + ellapsedTime);
    }
  }
  // Add last keyframe (100%)
  ballPath[ballPath.length] = { ts: ellapsedTime, top: bally, left: ballx, hide: bv.hidden, action: bv.action };
  return ellapsedTime;
}

function greenFriction(bv)
{
  if ( bv.speed > 50)
  {
    bv.speed *= golf.parms.fric1C;
  }
  else if (bv.speed > 20)
  {
    bv.speed *= golf.parms.fric2C;
  }
  else if (bv.speed > 10)
  {
    bv.speed *= golf.parms.fric3C;
  }
  else if (!bv.onslope)
  {
      bv.speed = 0;   // Don't roll forever
  }
}

function bounceX()
{
  var xs = bv.speed * Math.cos(bv.dir);
  var ys = bv.speed * Math.sin(bv.dir);
  xs = -1 * xs;
  bv.dir = Math.atan2(ys, xs);
  bv.speed = .55 * bv.speed;
  dx = Math.cos(bv.dir);
  dy = Math.sin(bv.dir);
}

function bounceY()
{
  var xs = bv.speed * Math.cos(bv.dir);
  var ys = bv.speed * Math.sin(bv.dir);
  ys = -1 * ys;
  bv.dir = Math.atan2(ys, xs);
  bv.speed = .55 * bv.speed;
  dx = Math.cos(bv.dir);
  dy = Math.sin(bv.dir);
}

function handleCollision()
{
  x = Math.round(ballx);
  y = Math.round(bally);
  var walls = golf.holes[curHoleNum].walls;
  for (var i=0 ; i < walls.length ; i++)
  {
      var hit = checkWall(walls[i]);
      if (hit) break;
  }
  var ballPoint = new Point2D(x,y);
  var polys = golf.holes[curHoleNum].polygons;
  bv.hidden = false;
  bv.action = null;
  bv.onslope = false;
  var inside = false;
  for (var i=0; i < polys.length ; i++ )
  {
    var f = polys[i];
    inside = f.isPointInside(ballPoint);
    if (inside) { 
      f.inEffect(bv);
      dx = Math.cos(bv.dir);
      dy = Math.sin(bv.dir);
      break; // can't be in more than one polygon at a time
    }
  }
  greenFriction(bv);
  checkHole(bv);
  if (golf.holes[curHoleNum].outLine.isOutOfBounds(ballPoint) ||
        ballPoint.x < 0 || ballPoint.y < 0 || ballPoint.x > 600 || ballPoint.y > 400)
  {
//    golf.log("Out of bounds!");
    bv.action = action.outOfBounds;
    bv.speed = 0;
  }
}


function checkWall(wall)
{
  
    if (wall.x1 == wall.x2)
    {
//      console.log("wall = " + wall.x1 + " ballx = " + ballx);
      //vertical
      if ((x == wall.x1) && (( y >= wall.ylo ) && ( y <= wall.yhi)))
      {
        bounceX();
        return true;
      }
    }
    else if (wall.y1 == wall.y2) 
    {
      // horizontal
      if ((y == wall.y1) && (( x >= wall.xlo ) && ( x <= wall.xhi)))
      {
        bounceY();
        return true;
      }
    }
    else
    {
//      var logleak = false;
//      if ((wall.x1 == 290) && (wall.y1==90) && (x>=wall.x1) && (x<=wall.x2) && (y < 94))
//      {
//        logleak = true;
//        golf.log("near leak? x = " + x + " y = "  + y);
//      }
      if ((x >= wall.xlo ) && (x <= wall.xhi) && ( ((y >= wall.ylo) && (y <= wall.yhi)) ) )
      {
        // We're in the quadrant
//          if (logleak) 
//          {
//             golf.log("x.lo = " + wall.xlo + ", x.hi = " + wall.xhi + ", y.lo = " + wall.ylo + ", y.hi = " + wall.yhi);
//             golf.log("wall.m = " + wall.m + ", wall.x1 = " + wall.x1 + ", wall.y1 = " + wall.y1);
//             golf.log("x - wall.x1 = " + (x - wall.x1) );
//          }
//         var ywall = wall.m * (x - wall.x1) + wall.y1;
         var ydelta = wall.m * (x - wall.x1);
//         if (logleak) golf.log("ydelta = " + ydelta + ", wall.y1 = " + wall.y1);
         var ywall = ydelta + wall.y1;
//         if (logleak) golf.log("ywall = " + ywall);
         var diff = ( ywall - y ) * wall.dir;
//         if (logleak) golf.log("ywall = " + ywall + ", diff = " + diff);
         if ( diff >= 0 )
         {
            //console.log("Hit angled wall...");
            //bv.speed = 0;
            if (diff > 1)
            {
                bally += wall.dir;
            }
            var tmpballangle = bv.dir - wall.angle;  // in radians
            if (tmpballangle < 0)
            {
              tmpballangle += TWOPI;
            }
            var t = TWOPI - tmpballangle + wall.angle;
            if (t >= TWOPI)
            {
              t -= TWOPI;
            }
            bv.dir = t;
            bv.speed = .6 * bv.speed;
            //console.log("Speed = " + bv.speed);
            dx = Math.cos(bv.dir);
            dy = Math.sin(bv.dir);
            return true;
         }
      }
    }
    return false;
}

function checkHole(bv)
{
  var holeCenter = golf.holes[curHoleNum].center;
  if ((Math.abs(holeCenter.cx - x) < 7) && (Math.abs(holeCenter.cy - y) < 7))
  {
    bv.speed = 0;
    bv.action = action.score;
  }
  
}

})();

