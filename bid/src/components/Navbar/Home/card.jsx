import Picture from '../assets/bid.webp'
import './card.css'
function Card(){
    return(
        <div className="card">
            <img className="card-image" src={Picture} alt="Picture"></img>
            <h2 className="card-tittle">Welcome to Auction </h2>
            <p className="card-text">"Where every bid brings you closer to something extraordinary! Discover unique treasures, unbeatable deals, and the thrill of the auction, all from the comfort of home. Whether you’re hunting for a rare find or ready to sell your own gems, join our vibrant community and start bidding today!"</p>

        </div>

    );
}

export default Card