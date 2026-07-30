function FPushButtonClass()
{
   this.init();
}
FPushButtonClass.prototype = new FUIComponentClass();
Object.registerClass("FPushButtonSymbol",FPushButtonClass);
FPushButtonClass.prototype.init = function()
{
   super.setSize(this._width,this._height);
   this.boundingBox_mc.unloadMovie();
   this.attachMovie("fpb_states","fpbState_mc",1);
   this.attachMovie("FLabelSymbol","fLabel_mc",2);
   this.attachMovie("fpb_hitArea","fpb_hitArea_mc",3);
   super.init();
   this.btnState = false;
   this.setClickHandler(this.clickHandler);
   this._xscale = 100;
   this._yscale = 100;
   this.setSize(this.width,this.height);
   if(this.label != undefined)
   {
      this.setLabel(this.label);
   }
   this.ROLE_SYSTEM_PUSHBUTTON = 43;
   this.STATE_SYSTEM_PRESSED = 8;
   this.EVENT_OBJECT_STATECHANGE = 32778;
   this.EVENT_OBJECT_NAMECHANGE = 32780;
   this._accImpl.master = this;
   this._accImpl.stub = false;
   this._accImpl.get_accRole = this.get_accRole;
   this._accImpl.get_accName = this.get_accName;
   this._accImpl.get_accState = this.get_accState;
   this._accImpl.get_accDefaultAction = this.get_accDefaultAction;
   this._accImpl.accDoDefaultAction = this.accDoDefaultAction;
};
FPushButtonClass.prototype.setHitArea = function(w, h)
{
   var hit = this.fpb_hitArea_mc;
   this.hitArea = hit;
   hit._visible = false;
   hit._width = w;
   hit._height = arguments.length <= 1 ? hit._height : h;
};
FPushButtonClass.prototype.setSize = function(w, h)
{
   w = w >= 6 ? w : 6;
   if(arguments.length > 1)
   {
      if(h < 6)
      {
         h = 6;
      }
   }
   super.setSize(w,h);
   this.setLabel(this.getLabel());
   this.arrangeLabel();
   this.setHitArea(w,h);
   this.boundingBox_mc._width = w;
   this.boundingBox_mc._height = h;
   this.drawFrame();
   if(this.focused)
   {
      super.myOnSetFocus();
   }
   this.initContentPos("fLabel_mc");
};
FPushButtonClass.prototype.arrangeLabel = function()
{
   var label = this.fLabel_mc;
   var h = this.height;
   var w = this.width - 2;
   var b = 1;
   this.fLabel_mc.setSize(w - b * 4);
   label._x = b * 3;
   label._y = h / 2 - label._height / 2;
};
FPushButtonClass.prototype.getLabel = function()
{
   return this.fLabel_mc.labelField.text;
};
FPushButtonClass.prototype.setLabel = function(label)
{
   this.fLabel_mc.setLabel(label);
   this.txtFormat();
   this.arrangeLabel();
   if(Accessibility.isActive())
   {
      Accessibility.sendEvent(this,0,this.EVENT_OBJECT_NAMECHANGE);
   }
};
FPushButtonClass.prototype.getEnabled = function()
{
   return this.enabled;
};
FPushButtonClass.prototype.setEnabled = function(enable)
{
   if(enable || enable == undefined)
   {
      this.gotoFrame(1);
      this.drawFrame();
      this.flabel_mc.setEnabled(true);
      this.enabled = true;
      super.setEnabled(true);
   }
   else
   {
      this.gotoFrame(4);
      this.drawFrame();
      this.flabel_mc.setEnabled(false);
      this.enabled = false;
      super.setEnabled(false);
   }
};
FPushButtonClass.prototype.txtFormat = function()
{
   var txtS = this.textStyle;
   var sTbl = this.styleTable;
   txtS.align = sTbl.textAlign.value != undefined ? undefined : (txtS.align = "center");
   txtS.leftMargin = sTbl.textLeftMargin.value != undefined ? undefined : (txtS.leftMargin = 1);
   txtS.rightMargin = sTbl.textRightMargin.value != undefined ? undefined : (txtS.rightMargin = 1);
   if(this.fLabel_mc._height > this.height)
   {
      super.setSize(this.width,this.fLabel_mc._height);
   }
   else
   {
      super.setSize(this.width,this.height);
   }
   this.fLabel_mc.labelField.setTextFormat(this.textStyle);
   this.setEnabled(this.enable);
};
FPushButtonClass.prototype.drawFrame = function()
{
   var b = 1;
   var x1 = 0;
   var y1 = 0;
   var x2 = this.width;
   var y2 = this.height;
   var mc_array = ["up_mc","over_mc","down_mc","disabled_mc"];
   var frame = mc_array[this.fpbState_mc._currentframe - 1];
   var mc = "frame";
   var i = 0;
   while(i < 6)
   {
      x1 += i % 2 * b;
      y1 += i % 2 * b;
      x2 -= (i + 1) % 2 * b;
      y2 -= (i + 1) % 2 * b;
      var w = Math.abs(x1 - x2) + 2 * b;
      var h = Math.abs(y1 - y2) + 2 * b;
      this.fpbState_mc[frame][mc + i]._width = w;
      this.fpbState_mc[frame][mc + i]._height = h;
      this.fpbState_mc[frame][mc + i]._x = x1 - b;
      this.fpbState_mc[frame][mc + i]._y = y1 - b;
      i++;
   }
};
FPushButtonClass.prototype.setClickHandler = function(chng, obj)
{
   this.handlerObj = arguments.length >= 2 ? obj : this._parent;
   this.clickHandler = chng;
};
FPushButtonClass.prototype.executeCallBack = function()
{
   this.handlerObj[this.clickHandler](this);
};
FPushButtonClass.prototype.initContentPos = function(mc)
{
   this.incrVal = 1;
   this.initx = this[mc]._x - this.getBtnState() * this.incrVal;
   this.inity = this[mc]._y - this.getBtnState() * this.incrVal;
   this.togx = this.initx + this.incrVal;
   this.togy = this.inity + this.incrVal;
};
FPushButtonClass.prototype.setBtnState = function(state)
{
   this.btnState = state;
   if(state)
   {
      this.fLabel_mc._x = this.togx;
      this.fLabel_mc._y = this.togy;
   }
   else
   {
      this.fLabel_mc._x = this.initx;
      this.fLabel_mc._y = this.inity;
   }
};
FPushButtonClass.prototype.getBtnState = function()
{
   return this.btnState;
};
FPushButtonClass.prototype.myOnSetFocus = function()
{
   this.focused = true;
   super.myOnSetFocus();
};
FPushButtonClass.prototype.onPress = function()
{
   this.pressFocus();
   this.fpbState_mc.gotoAndStop(3);
   this.drawFrame();
   this.setBtnState(true);
   if(Accessibility.isActive())
   {
      Accessibility.sendEvent(this,0,this.EVENT_OBJECT_STATECHANGE,true);
   }
};
FPushButtonClass.prototype.onRelease = function()
{
   this.fpbState_mc.gotoAndStop(2);
   this.drawFrame();
   this.executeCallBack();
   this.setBtnState(false);
   if(Accessibility.isActive())
   {
      Accessibility.sendEvent(this,0,this.EVENT_OBJECT_STATECHANGE,true);
   }
};
FPushButtonClass.prototype.onRollOver = function()
{
   this.fpbState_mc.gotoAndStop(2);
   this.drawFrame();
};
FPushButtonClass.prototype.onRollOut = function()
{
   this.fpbState_mc.gotoAndStop(1);
   this.drawFrame();
};
FPushButtonClass.prototype.onReleaseOutside = function()
{
   this.setBtnState(false);
   this.fpbState_mc.gotoAndStop(1);
   this.drawFrame();
};
FPushButtonClass.prototype.onDragOut = function()
{
   this.setBtnState(false);
   this.fpbState_mc.gotoAndStop(1);
   this.drawFrame();
};
FPushButtonClass.prototype.onDragOver = function()
{
   this.setBtnState(true);
   this.fpbState_mc.gotoAndStop(3);
   this.drawFrame();
};
FPushButtonClass.prototype.myOnKeyDown = function()
{
   if(Key.getCode() == 32 && this.pressOnce == undefined)
   {
      this.onPress();
      this.pressOnce = 1;
   }
};
FPushButtonClass.prototype.myOnKeyUp = function()
{
   if(Key.getCode() == 32)
   {
      this.onRelease();
      this.pressOnce = undefined;
   }
};
FPushButtonClass.prototype.get_accRole = function(childId)
{
   return this.master.ROLE_SYSTEM_PUSHBUTTON;
};
FPushButtonClass.prototype.get_accName = function(childId)
{
   return this.master.getLabel();
};
FPushButtonClass.prototype.get_accState = function(childId)
{
   if(this.pressOnce)
   {
      return this.master.STATE_SYSTEM_PRESSED;
   }
   return this.master.STATE_SYSTEM_DEFAULT;
};
FPushButtonClass.prototype.get_accDefaultAction = function(childId)
{
   return "Press";
};
FPushButtonClass.prototype.accDoDefaultAction = function(childId)
{
   this.master.onPress();
   this.master.onRelease();
};
