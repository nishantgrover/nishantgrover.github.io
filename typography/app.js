var imgDataArray = [];
            var canvasCnt = 30;

            $("#img2020").mouseover(function(){
                
                html2canvas($(".imgDiv")[0]).then(canvas => {

                    imgCanvas = canvas.getContext("2d");
                    var imgData = imgCanvas.getImageData(0, 0, canvas.width, canvas.height);
                    var pxArr = imgData.data;

                    for(let i=0;i<canvasCnt;i++) {
                        var a = new Uint8ClampedArray(imgData.data);
                        for (let j = 0; j < a.length; j++)
                            a[j] = 0;
                        imgDataArray.push(a);
                    }

                    for (let i = 0; i < pxArr.length; i+=4) {
                        var probDist = []; 
                        var sel = [];
                        for(let i=0;i<canvasCnt;i++) {
                            probDist.push(Math.random());
                            sel.push(i);
                        }
                        var temp = chance.weighted(sel, probDist);
                        let arr = imgDataArray[temp];
                        arr[i] = pxArr[i];
                        arr[i+1] = pxArr[i+1];
                        arr[i+2] = pxArr[i+2];
                        arr[i+3] = pxArr[i+3]; 
                    }

                    for (let i = 0; i < canvasCnt; i++) {
                        var cvs_i = document.createElement('canvas');
                        cvs_i.height = canvas.height;
                        cvs_i.width = canvas.width;
                        tempImgCanvas = cvs_i.getContext("2d");
                        tempImgCanvas.putImageData(new ImageData(imgDataArray[i], canvas.width , canvas.height), 0, 0);
                        cvs_i.classList.add("posFix");
                        $("body").append(cvs_i);
                    }
                    
                    $(".imgDiv").children().not(".posFix").fadeOut(300);

                    $(".posFix").each( function(idx){
                        
                        $({r:0}).animate({r:0.8},{
                            easing: "easeOutQuad",
                            duration: 500,
                            step: function(now) {
                                $(this).css({
                                    filter: 'blur('+now+'px)'
                                });
                            }
                        });
                        
                        var deltaTheta = 0;
                        var translateX = 0;
                        var translateY = 0;
                        let finalTheta = 5;
                        let finalX = 50;
                        let finalY = -50;
                        let totalDuration = 500+(60*idx);
                        let currentElement = $(this);

                        $({deg:0, x: 0, y:0}).animate({deg:finalTheta, x:finalX, y:finalY}, {
                            duration: totalDuration,
                            easing: "easeInQuad",
                            step: function(now, fx) {
                                if (fx.prop == "x") 
                                    translateX = now;
                                else if (fx.prop == "y") 
                                    translateY = now;
                                else if (fx.prop == "deg") 
                                    deltaTheta = now;
                                currentElement.css({
                                    transform: 'rotate(' + deltaTheta + 'deg)' + 'translate(' + translateX + 'px,'+ translateY +'px)'
                                });
                            }
                        });

                        $(this).delay(30*idx).fadeOut((60*idx),"easeInQuint", function(){
                            $(this).remove();
                        });
                    });
                });
            });