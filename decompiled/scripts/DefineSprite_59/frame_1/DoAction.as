function toggleAnimation()
{
   if(onEnterFrame == animationUpdate)
   {
      stopAnimation();
   }
   else
   {
      startAnimation();
   }
}
function startAnimation()
{
   animationButton.setLabel("stop animation");
   timeLast = getTimer();
   onEnterFrame = animationUpdate;
}
function stopAnimation()
{
   animationButton.setLabel("start animation");
   delete onEnterFrame;
}
function animationUpdate()
{
   var timeNow = getTimer();
   var dt = (timeNow - timeLast) / (animationSpeed * 1000);
   timeLast = timeNow;
   sunAngle += dt * 2 * 3.141592653589793;
   venusAngle += dt / 0.615178 * 2 * 3.141592653589793;
   deferentMC.lineMC._rotation = -57.29577951308232 * sunAngle;
   deferentMC.earthMC._rotation = (- sunAngle) * 57.29577951308232 + 90;
   deferentMC.sunMC._x = sunRadius * Math.cos(sunAngle);
   deferentMC.sunMC._y = (- sunRadius) * Math.sin(sunAngle);
   deferentMC.epicycleMC._x = deferentRadius * Math.cos(sunAngle);
   deferentMC.epicycleMC._y = (- deferentRadius) * Math.sin(sunAngle);
   var vx = epicycleRadius * Math.cos(venusAngle);
   var vy = (- epicycleRadius) * Math.sin(venusAngle);
   deferentMC.epicycleMC.venusMC._x = vx;
   deferentMC.epicycleMc.venusMC._y = vy;
   var v = {x:0,y:0};
   var s = {x:0,y:0};
   var e = {x:0,y:0};
   deferentMC.epicycleMC.venusMC.localToGlobal(v);
   deferentMC.sunMC.localToGlobal(s);
   deferentMC.localToGlobal(e);
   var evx = v.x - e.x;
   var evy = v.y - e.y;
   var svx = v.x - s.x;
   var svy = v.y - s.y;
   var evd = Math.sqrt(evx * evx + evy * evy);
   var svd = Math.sqrt(svx * svx + svy * svy);
   var esd = sunRadius;
   deferentMC.epicycleMC.venusMC._rotation = 57.29577951308232 * Math.atan2(svy,svx) - 90;
   var ca = (evd * evd + svd * svd - esd * esd) / (2 * evd * svd);
   if(ca > 1)
   {
      ca = 1;
   }
   else if(ca < -1)
   {
      ca = -1;
   }
   var a = Math.acos(ca);
   var sin = Math.sin;
   var cos = Math.cos;
   if(((venusAngle - sunAngle) / 6.283185307179586 % 1 + 1) % 1 > 0.5)
   {
      var f = 1;
   }
   else
   {
      f = -1;
   }
   var n = 4;
   var r = 100;
   var s = r * cos(a);
   var step = 3.141592653589793 / n;
   var halfStep = step / 2;
   var kr = r / cos(halfStep);
   var ks = s / cos(halfStep);
   var mc = this.phaseMC;
   mc._xscale = mc._yscale = 100 * (deferentRadius - epicycleRadius) / evd;
   mc.clear();
   mc.lineStyle(1,16711680,0);
   mc.moveTo(0,- r);
   mc.beginFill(4210752,100);
   var i = 1;
   while(i <= n)
   {
      var angle = i * step;
      var ax = r * sin(angle);
      var ay = (- r) * cos(angle);
      var cAngle = angle - halfStep;
      var cx = kr * sin(cAngle);
      var cy = (- kr) * cos(cAngle);
      mc.curveTo(f * cx,cy,f * ax,ay);
      i++;
   }
   var i = n - 1;
   while(i >= 0)
   {
      var angle = i * step;
      var ax = s * sin(angle);
      var ay = (- r) * cos(angle);
      var cAngle = angle + halfStep;
      var cx = ks * sin(cAngle);
      var cy = (- kr) * cos(cAngle);
      mc.curveTo(f * cx,cy,f * ax,ay);
      i--;
   }
   mc.endFill();
   mc.moveTo(0,- r);
   mc.beginFill(16777215,100);
   var i = 1;
   while(i <= n)
   {
      var angle = i * step;
      var ax = (- r) * sin(angle);
      var ay = (- r) * cos(angle);
      var cAngle = angle - halfStep;
      var cx = (- kr) * sin(cAngle);
      var cy = (- kr) * cos(cAngle);
      mc.curveTo(f * cx,cy,f * ax,ay);
      i++;
   }
   var i = n - 1;
   while(i >= 0)
   {
      var angle = i * step;
      var ax = s * sin(angle);
      var ay = (- r) * cos(angle);
      var cAngle = angle + halfStep;
      var cx = ks * sin(cAngle);
      var cy = (- kr) * cos(cAngle);
      mc.curveTo(f * cx,cy,f * ax,ay);
      i--;
   }
   mc.endFill();
}
animationButton.setStyleProperty("textColor",16777215);
animationButton.setStyleProperty("face",5263440);
animationButton.setStyleProperty("textBold",true);
animationButton.setLabel("start animation");
animationSpeed = 12;
epicycleRadius = 108;
deferentRadius = 150;
sunRadius = 290;
sunAngle = 0;
venusAngle = 0;
timeLast = getTimer();
animationUpdate();
