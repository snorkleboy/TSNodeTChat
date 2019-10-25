// basic typing and enum
const a = 5;
const b = "hi"

const capitalizeFirstLetters = (a,b)=>a.slice(0,b).toUpperCase().concat(a.slice(b,a.length-1))
capitalizeFirstLetters(a,b);
//
const aa:number = 5;
const bb:string = "hi"

const funcB = (a: string, b: number) => a.slice(0, b).toUpperCase().concat(a.slice(b, a.length - 1))
funcB(aa, bb);

enum ShapeType {
    circle,
    square,
    rectangle,
    diamond
}
//

// objects and Structural typeing

const c: object = {
    anything: "anything"
}

const cc:object = {
    name: "hello",
    type: ShapeType.circle,
    radius: 10,
    area: Math.PI * Math.pow(10, 2)
}
// cc. // no intellisense, no defined properties
const ccc:{
    name:string,
    type: ShapeType.circle,
    radius:number,
    area:number
} = {
    name: "hello",
    type: "circle",//needs to be ShapeType.circle
    radius: 10,
    area: Math.PI * Math.pow(10, 2)
}
// ccc.//intellisense becuase of defined properties
type circle = {
    name: string,
    type: ShapeType.circle,
    radius: number,
    area: number
}
interface Circle extends circle{

} // same thing as type, suble differences between interface and type alias
const cccc:circle={
    name: "hi",
    type: ShapeType.circle,
    area: 5,
    radius: 5
}
const cccc1: circle = {
    name: "other circle",
    type: ShapeType.circle,
    area: 15,
    radius: 15
}
//funO gets intellisense on o n input parameter
const funcO = (circle: circle)=>({msg:`is of type:${circle.type}`,context:circle})
funcO(cc); //doesnt work
funcO(ccc);
funcO(cccc);
funcO({
    name:"hi",
    type: ShapeType.circle,
    area:5,
    radius:5,
   // otherProperties: { ok: "false" }
})
//structural typing
const funcOO = (circle: { type: ShapeType }) => ({ msg: `is of type:${circle.type}`, context: circle})
funcOO(cc); //works if you dont define it as object explicitly
funcOO(ccc);
funcOO(cccc);
const aaaa = {
    type: ShapeType.circle,
    name: "hi",
    area: 5,
    radius: 5,
    otherTHing:true
}
funcOO(aaaa)


//unions and generics
interface IShape{
    type:ShapeType
}
interface Rectangle extends IShape{
    length:number,
    width:number,
    type:ShapeType.rectangle
}
type shapes = Rectangle | circle
type implimentedShapeTypes = shapes['type']

const isString = (s):s is string=>typeof s === 'string'
const takesInNumberOrString = (input : number|string)=>{
    //typeguard
    if (isString(input)){
        return input.split("") // string intellisense
    }
}
//generic return and input
//is this real life or is it just fantasy? 

//following works becuase returnValue is of type any... sometimes you will create 'unimplimentable' types
const convertStringOrNumber = <T extends number|string>(input: T): T extends string? number : string => {
    let returnValue;
    if (isString(input)) {
        returnValue = parseInt(input);
    }else{
        returnValue = input.toString();
    }
    return returnValue;
}
const num = convertStringOrNumber("5");
const str = convertStringOrNumber(5);




//callbacks and promises
//Promise<any> //:()=>Promise<Array<number>> //:()=>Promise<Array<circle>> //:()=>Promise<Array<{isObject:Boolean}>>
const getCircle = () => fetch("shapes").then(res => res.json()); 
getCircle().then(d=>d[0])//try with differnt promise definitions
const apiClient:any = {};

type findInPagifiedResultsFunc = (url: string, cb:(a:any)=>boolean, pageTotry:number)=>Promise<any>;
const findInPagifiedResults: findInPagifiedResultsFunc = (url, cb, pageTotry = 0) => apiClient.get(`${url}?page=${pageTotry}`)
        .then(data=>{
            if (cb(data)){
                return findInPagifiedResults(url, cb, pageTotry++);
            }else{
                return data
            }
        })



//classes
class Shape{
    type: ShapeType = ShapeType.circle;
    constructor(public name:string){
        // this.type = ShapeType.circle
        // this.name = name 
    }
    private privateThing =()=>{}
    protected protectedThing =()=>{}
    public publicThing =()=>{
        this.privateThing();
        this.protectedThing();
    }
}
class Circle extends Shape{
    type:ShapeType.circle
    private constructor(public radius, name){
        super(name);
    }
    circleMethod = ()=>{
        //protected/private
        this.protectedThing();
    }
    public static createCircle = (radius,name)=>{
        return new Circle(radius,name);
    }
}
const gfd = Circle.createCircle(5,"circ");
gfd. //public privates
class Square extends Shape{
    type: ShapeType.square
    constructor(public height, public length, name) {
        super(name);
    }
}