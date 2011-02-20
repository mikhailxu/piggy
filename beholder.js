Bouncing Beholder

My winning JS1K entry---a JavaScript platform game that fits in 1024 bytes.

I gave a talk on this at the November Berlin JS user group. Slides here. Though they might be hard to follow without commentary.

(See here for my old, space-defense game entry.)

Use the arrow keys to move and jump. Collect as many coins as you can. Be wary of purple-colored grass.

This is the code (newlines added):

c=document.body.children[0];h=t=150;L=w=c.width=800;u=D=50;H=[];R=Math.random;for($ in C=
c.getContext('2d'))C[$[J=X=Y=0]+($[6]||'')]=C[$];setInterval("if(D)for(x=405,i=y=I=0;i<1e4;)L=\
H[i++]=i<9|L<w&R()<.3?w:R()*u+80|0;$=++t%99-u;$=$*$/8+20;y+=Y;x+=y-H[(x+X)/u|0]>9?0:X;j=H[o=\
x/u|0];Y=y<j|Y<0?Y+1:(y=j,J?-10:0);with(C){A=function(c,x,y,r){r&&arc(x,y,r,0,7,0);fillStyle=c.P\
?c:'#'+'ceff99ff78f86eeaaffffd45333'.substr(c*3,3);f();ba()};for(D=Z=0;Z<21;Z++){Z<7&&A(Z%6,w/\
2,235,Z?250-15*Z:w);i=o-5+Z;S=x-i*u;B=S>9&S<41;ta(u-S,0);G=cL(0,T=H[i],0,T+9);T%6||(A(2,25,T-7\
,5),y^j||B&&(H[i]-=.1,I++));G.P=G.addColorStop;G.P(0,i%7?'#7e3':(i^o||y^T||(y=H[i]+=$/99),\
'#c7a'\));G.P(1,'#ca6');i%4&&A(6,t/2%200,9,i%2?27:33);m(-6,h);qt(-6,T,3,T);l(47,T);qt(56,T,56,\
h);A(G);i%3?0:T<w?(A(G,33,T-15,10),fc(31,T-7,4,9)):(A(7,25,$,9),A(G,25,$,5),fc(24,$,2,h),D=B&y\
>$-9?1:D);ta(S-u,0)}A(6,u,y-9,11);A(5,M=u+X*.7,Q=y-9+Y/5,8);A(8,M,Q,5);fx(I+'c',5,15)}D=y>h?1:D"
,u);onkeydown=onkeyup=function(e){E=e.type[5]?4:0;e=e.keyCode;J=e^38?J:E;X=e^37?e^39?X:E:-E}
WHY?

I've heard people wax poetic about programming old, limited-memory machines. I wouldn't know anything about those---at the time they were current, I was writing rudimentary number-guessing games in BASIC. But doing this competition entry gave me a taste of what they might be talking about.

In typical 21st-century programming, the machine limits one has to deal with are wide and fuzzy. Program size is rarely an issue, so like painters working on an infinite canvas, we often don't know when to stop. When a program has to fit in a tightly limited space, the experience is different. You program by carefully refining every single expression, chipping away at your code until it reflects your vision as well as it can.

In terms of productivity, this is an awful way of coding. But it certainly is fun. Not to mention that it gives me an excuse to use every kind of weird hack I can think of.

HOW?

For a start, of course, there are the tiny local tricks that save a few bytes here and there, which adds up to at least a hundred bytes on the whole program. |0 truncates, && or ?: can replace if (sometimes), & can replace && (sometimes), you can reuse initializers (J=X=Y=0), a with statement can shorten object access, etc.

Compression algorithms, such as Google's Closure Compiler and UglifyJS, and various eval/replace hacks suggested for the JS1K contest, don't really do much on properly hand-compressed code. In fact, they all ended up making the code bigger...

The tiny size required me to design the program in a 'holistic', highly un-modular way, meaning every single aspect of the program could influence every other one. There was an issue causing the clouds to be drawn incorrectly for negative X coordinates. To work around this would have required quite a few extra characters (I was using x|0 where I actually needed Math.floor(x)). Instead, I made the playing field start at 400 and put empty space at the start to prevent the player from seeing any negative X coordinates. Problem solved.

Mechanized Abbreviation

The coolest hack in this program is probably the mechanized abbreviation of the canvas context methods. Method names like quadraticCurveTo, createLinearGradient are nice and explicit, but those two taken together already eat 3.5% of the bytes available---when only referenced once! I needed to use them, but I wanted to avoid spelling them.

Turns out I can get away with that. At the start of the program there is a for/in loop that goes over the properties of the canvas context, and adds a new property, with a shorter name, for each of them. It took some experimenting to find an abbreviation algorithm that doesn't have clashes on any of the methods we use---I ended up using the first letter of the name plus the the 7th letter, if any. So lineTo becomes l, and quadraticCurveTo becomes qt. I can then use these short names to actually access the methods---without ever having written out the full name.

This does, of course, not work for properties like fillStyle. You can copy those, but the copies won't do anything.

Functions As a Scarce Resource

Functions are hugely useful for factoring out pieces of shared functionality, and thus shortening code. Unfortunately, the word 'function' is 8 characters, and the minimal overhead for a function definition something like 14 bytes, 20 if you actually want to return something.

Thus, a function has to be really, really useful before it pays off to define it.

The program started off with five functions, which has since been reduced to two. In one of these places, I have little choice---window.onkeydown only takes function values. I'm using the same function for onkeydown and onkeyup, which turned out to be more efficient anyway. The checks for which key is pressed or released are also repeated in both. To check whether an event is a keydown or a keyup, I used e.type[5], where e is the event object. If this is a keyup event, the type of the event does not have a 6th character, so that this evaluates to a falsy value.

The other function used is the one called A. This rolls three pieces of functionality into one (saving me two function keywords). It takes a fillstyle as its first argument, and an optional x, y, and radius after that. If the optional arguments are provided, it starts by drawing a circle. Then it sets the fillStyle of the canvas context to the provided style, or---if the style is not a gradient---it uses it as an index into a string of colors. After this, it calls (the abbreviated versions of) fill() and beginPath() on the canvas context. Note that, because a canvas context is specified to start with an empty path, it is safe to start drawing before the first call to beginPath, and thus beginPath, though it is usually done before one starts drawing, can be made part of our 'after-drawing routine'.

This function is used in three different ways. Obviously, it is used to draw colored circles (the game contains a lot of circles). But code that has drawn a path in some other way (the ground blocks) can also call it to just assign a fillStyle and fill the path. Finally, code that just wants to set the fillStyle can use it for that---as long as no path is in the process of being drawn. Now that's reusability. The program uses this function in ten different places.

The World

The game world is divided (along the x axis) into 50-pixel-wide units. When starting a game (or at game-over time), an array is initialized containing a randomized height-map. The gaps work mostly the same as the other positions, their height is just off the bottom of the canvas. The generating algorithm takes some care to not introduce gaps of more than one unit, since those would be unjumpable. This heightmap array (plus the player's position, speed, and a time counter for animation) represents pretty much the whole game state.

So how does the game know where the coins are, if it is not explicitly keeping state for them? Every block whose random height is divisible by 6 gets a coin, and when the player collects the coin, .1 is subtracted from the height, and the coin no longer shows up.

Apart from block height, block's x-coordinates can also be used to add distinctive features. Every third block gets a decorative tree, if it is visible. If it is invisible, it gets a (stylized) Piranha Plant. Every seventh block is purple/sinky. This produces a relatively nice random world, without requiring involved data structures or lots of code.

Physics

The 'physics' in this game are coded in an entirely ad-hoc and special-cased way. Player movement needs to be restricted in two ways---you can't walk through the sides of blocks, and you shouldn't fall through the top. The first is handled by simply cancelling horizontal movement whenever it would take the player more than nine (the highers 1-byte number...) pixels below the ground, and the second is simply a direct check against the height array. If the player is below or on the ground, his y position is set to ground level, and his vertical speed is set to zero, unless the up arrow is pressed, in which case it is set to minus ten (minus is up). In the other case, where the player is above the ground, one is added to the vertical speed, creating a gravity effect.

Collision detection is also handled case-by-case. The most involved case is collision with the plants, which takes some 20 characters. The 'is the player near the middle of this block' part of the test is reused to determine whether a coin is being picked up.

CODE

Below follows a somewhat expanded, formatted, lightly commented version of the code. The interval code was made a function (it is a string the compressed version) to conveniently allow newlines inside of it.

canvas=document.body.children[0];
screen_height=time=150;
last_height=screen_width=canvas.width=800;
unit=dead=50;
heights=[];

// The abbreviation loop, initializing the variabled needed by the key-handlers on the side.
for(prop in context=canvas.getContext('2d'))
  context[prop[jump=speed_x=speed_y=0]+(prop[6]||'')]=context[prop];

setInterval(function(){
  if(dead)
    // initialize the player position, score, and heightmap
    for(x=405,i=y=score=0;i<1e4;)
      // (screen_width is reused as the off-the-screen height of gap blocks)

      // a block can be a gap if its index is <9, or if the last block was no gap. after this test,
      // a random number is compared to .3 to determine whether an actual gap is generated, or a
      // regular random height.
      last_height=heights[i++]=
        i<9|last_height<screen_width&Math.random()<.3?screen_width:Math.random()*unit+80|0;

  // silly formula to create parabolic movement based on the time
  plant_pos=++time%99-unit;plant_pos=plant_pos*plant_pos/8+20;

  
  y+=speed_y;
  // only move horizontally if that doesn't take us deep underground (x/unit|0 fetches the index of
  // the block below an x coordinate)
  x+=y-heights[(x+speed_x)/unit|0]>9?0:speed_x;
  // compute final player height index, and ground level under it
  ground=heights[player_index=x/unit|0];
  // adjust y and speed_y based on whether we are on the ground or not
  speed_y=y<ground|speed_y<0?speed_y+1:(y=ground,jump?-10:0);

  // we'll need the context a lot
  with(context){
    A=function(color,x,y,radius){
      // a is the abbreviated form of arc
      radius&&a(x,y,radius,0,7,0);
      // if color is not a gradient object (we set a P property in gradient objects), it is an index
      // into a set of colors
      fillStyle=color.P?color:'#'+'ceff99ff78f86eeaaffffd45333'.substr(color*3,3);
      // f for fill, ba for beginPath
      f(); ba();
    };

    // now loop over visible, or close to visible, blocks, and draw them and their clouds
    for(dead=i=0;i<21;i++){
      // this loop is reused for drawing the background/rainbow, which consists of seven concentric
      // circles. there's no good reason why interleaving clearing the screen with drawing the
      // screen's contents should work, but in this case it does
      i<7&&A(i%6,screen_width/2,235,i?250-15*i:screen_width);
      
      // we start drawing 5 units in front of the player (first four will be off-screen, needed just
      // for clouds)
      height_index=player_index-5+i;

      scroll_pos=x-height_index*unit;
      // since player screen position is fixed, we can use scroll position for collision detection.
      // this variable indicates whether the player is in the 'middle' of the current block
      player_in_middle=scroll_pos>9&scroll_pos<41;

      // ta for translate. move to start of block to make other drawing commands shorter
      ta(unit-scroll_pos,0);
      // cL for createLinearGradient, for the ground/grass gradient
      gradient=cL(0,height=heights[height_index],0,height+9);
      // if height is divisible by 6, there's a coin here. draw it. if the player is standing on the
      // ground, in the middle of this unit, pick up the coin
      height%6||(A(2,25,height-7,5),y^ground||player_in_middle&&(heights[height_index]-=.1,score++));

      // abbreviate, since we need this twice (and use it again to test whether a value passed to A
      // is a gradient)
      gradient.P=gradient.addColorStop;
      // this implements sinky terrain---when the index is divisible by 7, we use a different color,
      // and do the sinking if the player is standing here
      gradient.P(0,height_index%7?'#5e1':(height_index^player_index||y^height||
                                          (y=heights[height_index]+=plant_pos/99),'#a59'));
      // brown earth color for the bottom of the gradient
      gradient.P(1,'#b93');

      // this draws the clouds
      height_index%4&&A(6,time/2%200,9,height_index%2?27:33);

      // draws the terrain block. m is moveTo, qt is quadraticCurveTo, l is lineTo
      m(-6,screen_height);qt(-6,height,3,height);l(47,height);qt(56,height,56,screen_height);A(gradient);

      // draw deco trees or piranha plant (height==screen_width for gap blocks), check for collision
      // with plant
      height_index%3?0:height<screen_width
        ?(A(gradient,33,height-15,10),fc(31,height-7,4,9))
        :(A(7,25,plant_pos,9),A(3,25,plant_pos,5),fc(24,plant_pos,2,screen_height),
          dead=player_in_middle&y>plant_pos-9?1:dead);

      // undo block-local translation
      ta(scroll_pos-unit,0)
    }

    // draws the player, using the speed to adjust the position of the iris
    A(6,unit,y-9,11);
    A(5,iris_x=unit+speed_x*.7,iris_y=y-9+speed_y/5,8);
    A(8,iris_x,iris_y,5);

    // color is already dark from eye pupil, draw score with this color
    fx(score+'¢',5,15)
  }

  // check whether the player has fallen off the screen
  dead=y>screen_height?1:dead
},unit);

onkeydown=onkeyup=function(e){
  // if this is a keydown event, new_val gets the value 4, otherwise 0
  new_val=e.type[5]?4:0;
  e=e.keyCode;

  // give jump a truthy value if up was pressed, falsy if up was released
  jump=e^38?jump:new_val;

  // similar for speed_x, inverting new_val if left is pressed
  speed_x=e^37?e^39?speed_x:new_val:-new_val
}

