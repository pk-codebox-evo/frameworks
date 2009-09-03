/*
	Copyright (c) 2004-2009, The Dojo Foundation All Rights Reserved.
	Available via Academic Free License >= 2.1 OR the modified BSD license.
	see: http://dojotoolkit.org/license for details
*/


if(!dojo._hasResource["dojox.grid.DataGrid"]){
dojo._hasResource["dojox.grid.DataGrid"]=true;
dojo.provide("dojox.grid.DataGrid");
dojo.require("dojox.grid._Grid");
dojo.require("dojox.grid.DataSelection");
dojo.declare("dojox.grid.DataGrid",dojox.grid._Grid,{store:null,query:null,queryOptions:null,fetchText:"...",items:null,_store_connects:null,_by_idty:null,_by_idx:null,_cache:null,_pages:null,_pending_requests:null,_bop:-1,_eop:-1,_requests:0,rowCount:0,_isLoaded:false,_isLoading:false,postCreate:function(){
this._pages=[];
this._store_connects=[];
this._by_idty={};
this._by_idx=[];
this._cache=[];
this._pending_requests={};
this._setStore(this.store);
this.inherited(arguments);
},createSelection:function(){
this.selection=new dojox.grid.DataSelection(this);
},get:function(_1,_2){
return (!_2?this.defaultValue:(!this.field?this.value:this.grid.store.getValue(_2,this.field)));
},_onSet:function(_3,_4,_5,_6){
var _7=this.getItemIndex(_3);
if(_7>-1){
this.updateRow(_7);
}
},_addItem:function(_8,_9,_a){
var _b=this._hasIdentity?this.store.getIdentity(_8):dojo.toJson(this.query)+":idx:"+_9+":sort:"+dojo.toJson(this.getSortProps());
var o={idty:_b,item:_8};
this._by_idty[_b]=this._by_idx[_9]=o;
if(!_a){
this.updateRow(_9);
}
},_onNew:function(_d,_e){
var _f=this.attr("rowCount");
this._addingItem=true;
this.updateRowCount(_f+1);
this._addingItem=false;
this._addItem(_d,_f);
this.showMessage();
},_onDelete:function(_10){
var idx=this._getItemIndex(_10,true);
if(idx>=0){
var o=this._by_idx[idx];
this._by_idx.splice(idx,1);
delete this._by_idty[o.idty];
this.updateRowCount(this.attr("rowCount")-1);
if(this.attr("rowCount")===0){
this.showMessage(this.noDataMessage);
}
}
},_onRevert:function(){
this._refresh();
},setStore:function(_13,_14,_15){
this._setQuery(_14,_15);
this._setStore(_13);
this._refresh(true);
},setQuery:function(_16,_17){
this._setQuery(_16,_17);
this._refresh(true);
},setItems:function(_18){
this.items=_18;
this._setStore(this.store);
this._refresh(true);
},_setQuery:function(_19,_1a){
this.query=_19;
this.queryOptions=_1a||this.queryOptions;
},_setStore:function(_1b){
if(this.store&&this._store_connects){
dojo.forEach(this._store_connects,function(arr){
dojo.forEach(arr,dojo.disconnect);
});
}
this.store=_1b;
if(this.store){
var f=this.store.getFeatures();
var h=[];
this._canEdit=!!f["dojo.data.api.Write"]&&!!f["dojo.data.api.Identity"];
this._hasIdentity=!!f["dojo.data.api.Identity"];
if(!!f["dojo.data.api.Notification"]&&!this.items){
h.push(this.connect(this.store,"onSet","_onSet"));
h.push(this.connect(this.store,"onNew","_onNew"));
h.push(this.connect(this.store,"onDelete","_onDelete"));
}
if(this._canEdit){
h.push(this.connect(this.store,"revert","_onRevert"));
}
this._store_connects=h;
}
},_onFetchBegin:function(_1f,req){
if(this.rowCount!=_1f){
if(req.isRender){
this.scroller.init(_1f,this.keepRows,this.rowsPerPage);
this.rowCount=_1f;
this._setAutoHeightAttr(this.autoHeight,true);
this.prerender();
}else{
this.updateRowCount(_1f);
}
}
},_onFetchComplete:function(_21,req){
if(_21&&_21.length>0){
dojo.forEach(_21,function(_23,idx){
this._addItem(_23,req.start+idx,true);
},this);
this.updateRows(req.start,_21.length);
if(req.isRender){
this.setScrollTop(0);
this.postrender();
}else{
if(this._lastScrollTop){
this.setScrollTop(this._lastScrollTop);
}
}
}
delete this._lastScrollTop;
if(!this._isLoaded){
this._isLoading=false;
this._isLoaded=true;
if(!_21||!_21.length){
this.showMessage(this.noDataMessage);
this.focus.initFocusView();
}else{
this.showMessage();
}
}
this._pending_requests[req.start]=false;
},_onFetchError:function(err,req){
console.log(err);
delete this._lastScrollTop;
if(!this._isLoaded){
this._isLoading=false;
this._isLoaded=true;
this.showMessage(this.errorMessage);
}
this.onFetchError(err,req);
},onFetchError:function(err,req){
},_fetch:function(_29,_2a){
var _29=_29||0;
if(this.store&&!this._pending_requests[_29]){
if(!this._isLoaded&&!this._isLoading){
this._isLoading=true;
this.showMessage(this.loadingMessage);
}
this._pending_requests[_29]=true;
try{
if(this.items){
var _2b=this.items;
var _2c=this.store;
this.rowsPerPage=_2b.length;
var req={start:_29,count:this.rowsPerPage,isRender:_2a};
this._onFetchBegin(_2b.length,req);
var _2e=0;
dojo.forEach(_2b,function(i){
if(!_2c.isItemLoaded(i)){
_2e++;
}
});
if(_2e===0){
this._onFetchComplete(_2b,req);
}else{
var _30=function(_31){
_2e--;
if(_2e===0){
this._onFetchComplete(_2b,req);
}
};
dojo.forEach(_2b,function(i){
if(!_2c.isItemLoaded(i)){
_2c.loadItem({item:i,onItem:_30,scope:this});
}
},this);
}
}else{
this.store.fetch({start:_29,count:this.rowsPerPage,query:this.query,sort:this.getSortProps(),queryOptions:this.queryOptions,isRender:_2a,onBegin:dojo.hitch(this,"_onFetchBegin"),onComplete:dojo.hitch(this,"_onFetchComplete"),onError:dojo.hitch(this,"_onFetchError")});
}
}
catch(e){
this._onFetchError(e);
}
}
},_clearData:function(){
this.updateRowCount(0);
this._by_idty={};
this._by_idx=[];
this._pages=[];
this._bop=this._eop=-1;
this._isLoaded=false;
this._isLoading=false;
},getItem:function(idx){
var _34=this._by_idx[idx];
if(!_34||(_34&&!_34.item)){
this._preparePage(idx);
return null;
}
return _34.item;
},getItemIndex:function(_35){
return this._getItemIndex(_35,false);
},_getItemIndex:function(_36,_37){
if(!_37&&!this.store.isItem(_36)){
return -1;
}
var _38=this._hasIdentity?this.store.getIdentity(_36):null;
for(var i=0,l=this._by_idx.length;i<l;i++){
var d=this._by_idx[i];
if(d&&((_38&&d.idty==_38)||(d.item===_36))){
return i;
}
}
return -1;
},filter:function(_3c,_3d){
this.query=_3c;
if(_3d){
this._clearData();
}
this._fetch();
},_getItemAttr:function(idx,_3f){
var _40=this.getItem(idx);
return (!_40?this.fetchText:this.store.getValue(_40,_3f));
},_render:function(){
if(this.domNode.parentNode){
this.scroller.init(this.attr("rowCount"),this.keepRows,this.rowsPerPage);
this.prerender();
this._fetch(0,true);
}
},_requestsPending:function(_41){
return this._pending_requests[_41];
},_rowToPage:function(_42){
return (this.rowsPerPage?Math.floor(_42/this.rowsPerPage):_42);
},_pageToRow:function(_43){
return (this.rowsPerPage?this.rowsPerPage*_43:_43);
},_preparePage:function(_44){
if((_44<this._bop||_44>=this._eop)&&!this._addingItem){
var _45=this._rowToPage(_44);
this._needPage(_45);
this._bop=_45*this.rowsPerPage;
this._eop=this._bop+(this.rowsPerPage||this.attr("rowCount"));
}
},_needPage:function(_46){
if(!this._pages[_46]){
this._pages[_46]=true;
this._requestPage(_46);
}
},_requestPage:function(_47){
var row=this._pageToRow(_47);
var _49=Math.min(this.rowsPerPage,this.attr("rowCount")-row);
if(_49>0){
this._requests++;
if(!this._requestsPending(row)){
setTimeout(dojo.hitch(this,"_fetch",row,false),1);
}
}
},getCellName:function(_4a){
return _4a.field;
},_refresh:function(_4b){
this._clearData();
this._fetch(0,_4b);
},sort:function(){
this._lastScrollTop=this.scrollTop;
this._refresh();
},canSort:function(){
return (!this._isLoading);
},getSortProps:function(){
var c=this.getCell(this.getSortIndex());
if(!c){
return null;
}else{
var _4d=c["sortDesc"];
var si=!(this.sortInfo>0);
if(typeof _4d=="undefined"){
_4d=si;
}else{
_4d=si?!_4d:_4d;
}
return [{attribute:c.field,descending:_4d}];
}
},styleRowState:function(_4f){
if(this.store&&this.store.getState){
var _50=this.store.getState(_4f.index),c="";
for(var i=0,ss=["inflight","error","inserting"],s;s=ss[i];i++){
if(_50[s]){
c=" dojoxGridRow-"+s;
break;
}
}
_4f.customClasses+=c;
}
},onStyleRow:function(_55){
this.styleRowState(_55);
this.inherited(arguments);
},canEdit:function(_56,_57){
return this._canEdit;
},_copyAttr:function(idx,_59){
var row={};
var _5b={};
var src=this.getItem(idx);
return this.store.getValue(src,_59);
},doStartEdit:function(_5d,_5e){
if(!this._cache[_5e]){
this._cache[_5e]=this._copyAttr(_5e,_5d.field);
}
this.onStartEdit(_5d,_5e);
},doApplyCellEdit:function(_5f,_60,_61){
this.store.fetchItemByIdentity({identity:this._by_idx[_60].idty,onItem:dojo.hitch(this,function(_62){
var _63=this.store.getValue(_62,_61);
if(typeof _63=="number"){
_5f=isNaN(_5f)?_5f:parseFloat(_5f);
}else{
if(typeof _63=="boolean"){
_5f=_5f=="true"?true:_5f=="false"?false:_5f;
}else{
if(_63 instanceof Date){
var _64=new Date(_5f);
_5f=isNaN(_64.getTime())?_5f:_64;
}
}
}
this.store.setValue(_62,_61,_5f);
this.onApplyCellEdit(_5f,_60,_61);
})});
},doCancelEdit:function(_65){
var _66=this._cache[_65];
if(_66){
this.updateRow(_65);
delete this._cache[_65];
}
this.onCancelEdit.apply(this,arguments);
},doApplyEdit:function(_67,_68){
var _69=this._cache[_67];
this.onApplyEdit(_67);
},removeSelectedRows:function(){
if(this._canEdit){
this.edit.apply();
var _6a=this.selection.getSelected();
if(_6a.length){
dojo.forEach(_6a,this.store.deleteItem,this.store);
this.selection.clear();
}
}
}});
dojox.grid.DataGrid.markupFactory=function(_6b,_6c,_6d,_6e){
return dojox.grid._Grid.markupFactory(_6b,_6c,_6d,function(_6f,_70){
var _71=dojo.trim(dojo.attr(_6f,"field")||"");
if(_71){
_70.field=_71;
}
_70.field=_70.field||_70.name;
if(_6e){
_6e(_6f,_70);
}
});
};
}
