import { BrowserRouter as Routes, Route, Router, BrowserRouter } from 'react-router-dom';
import Home from '../components/Home/Home'
function rout() {
    return(
        <BrowserRouter>
         <Routes>
            <Route path="/" element={<Home />} />
            
         </Routes>
        </BrowserRouter>

    );
}
export default rout;
  