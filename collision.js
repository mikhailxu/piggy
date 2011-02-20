Off the cuff, Prototype style. 
//Note, this is not optimal; there should be some basic partitioning and caching going on. 
(function () { 
    var elements = []; 
    Element.register = function (element) { 
        for (var i=0; i<elements.length; i++) { 
            if (elements[i]==element) break; 
        } 
        elements.push(element); 
        if (arguments.length>1)  
            for (var i=0; i<arguments.length; i++)  
                Element.register(arguments[i]); 
    }; 
    Element.collide = function () { 
        for (var outer=0; outer < elements.length; outer++) { 
            var e1 = Object.extend( 
                $(elements[outer]).positionedOffset(), 
                $(elements[outer]).getDimensions() 
            ); 
            for (var inner=outer; inner<elements.length; innter++) { 
                var e2 = Object.extend( 
                    $(elements[inner]).positionedOffset(), 
                    $(elements[inner]).getDimensions() 
                ); 
                if (     
                    (e1.left+e1.width)>=e2.left && e1.left<=(e2.left+e2.width) && 
                    (e1.top+e1.height)>=e2.top && e1.top<=(e2.top+e2.height) 
                ) { 
                    $(elements[inner]).fire(':collision', {element: $(elements[outer])}); 
                    $(elements[outer]).fire(':collision', {element: $(elements[inner])}); 
                } 
            } 
        } 
    }; 
})(); 

//Usage: 
Element.register(myElementA); 
Element.register(myElementB); 
$(myElementA).observe(':collision', function (ev) { 
    console.log('Damn, '+ev.memo.element+', that hurt!'); 
}); 
//detect collisions every 100ms 
setInterval(Element.collide, 100);

