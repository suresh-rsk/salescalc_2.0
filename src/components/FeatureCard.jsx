const FeatureCard = ({props, onClick}) =>{
    console.log(props)
    return(
        <div className="feature-card" onClick={()=>onClick(true,props.title)}>
            <p className="feature-title">{props.title}</p>
            <img className="feature-image" src={props.image}/>
        </div>
    )
}

export default FeatureCard;