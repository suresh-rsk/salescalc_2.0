import './App.css';
import { useState } from 'react';
import ContentBox from './components/ContentBox';
import DiscountImg from './assets/Discount.jpg';
import FeatureCard from './components/FeatureCard';
import GSTImg from './assets/GST.jpg';
import TDSImg from './assets/TDS.jpg';
import PercentImg from './assets/Percent.jpg';
import FakeImg from './assets/Fake.jpg';
import DialogBox from './components/core/DialogBox/DialogBox';

import "primereact/resources/themes/lara-light-indigo/theme.css";
import "primereact/resources/primereact.min.css";
import "primeicons/primeicons.css";

function App() {

  const features = [
    {title: "Discount", image: DiscountImg },
    {title: "GST", image: GSTImg},
    {title: "TDS", image: TDSImg},
    {title: "Percent", image: PercentImg},
    {title: "Fake", image: FakeImg}
  ]

  const [showDialog, setShowDialog] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);

  const setDialog =(state,value)=>{
    console.log(state,value)
    setShowDialog(state);
    setCurrentItem(value);
  }

  return (
    <div className="App">
      {showDialog && <DialogBox details={<ContentBox item={currentItem}/>} header={currentItem} onHide={()=>setShowDialog(false)} visible={showDialog} size='md' />}
      <div className='container'>
        <div className='header'>
          <p className='header-text'>Sales Calculator</p>
        </div>
        <div className='body'>
          {features.map(item => <FeatureCard props={item} onClick={setDialog}/>)}
        </div>
      </div>
    </div>
  );
}

export default App;
