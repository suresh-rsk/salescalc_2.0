import { useState } from 'react';
import DialogBox from './core/DialogBox/DialogBox';
import InputField from './core/InputField/InputField';
import ButtonWrapper from './core/Button/Button';

const ContentBox = ({item}) =>{

    console.log("ITEM",item)
    const DialogContent = () =>{

        const [data, setData] = useState({amount:0, percent:18, tds:2, newAmount:0, tax:0, tdsCalc:0, final:0})
        
        const discountCalc = () =>{
            switch(item){
                case "Discount":
                    {
                        let tax = data.amount * data.percent / 100;
                        let final = data.amount - tax;
                        setData({...data, newAmount:data.amount, tax:tax, final: final })
                        return;
                    }
                case "GST":
                    {
                        let tax = Math.round(data.amount * data.percent / 100);
                        let final = Math.round(data.amount) + Math.round(tax);
                        setData({...data, newAmount:data.amount, tax:tax, final: final })
                        return;
                    }
                case "TDS":
                    {
                        let newAmount = data.amount/(100 + data.percent) * 100;
                        let tax = Math.round(data.amount - newAmount);
                        let tds = Math.round(newAmount * data.tds / 100);
                        let final = Math.round(data.amount - newAmount * data.tds / 100);
                        setData({...data, newAmount:Math.round(newAmount), tax:tax, tdsCalc:tds, final: final })
                        return;
                    }   
                case "Percent":
                    {
                        let tax = Math.round(data.amount - 100 * data.amount / (100 + data.percent));
                        let final = Math.round(100 * data.amount / (100 + data.percent));
                        setData({...data, newAmount:data.amount, tax:tax, final: final })
                        return;
                    }
                case "Fake":
                    {
                        let tax = Math.round(100 * data.amount / (100 - data.percent) - data.amount);
                        let final = Math.round(100 * data.amount / (100 - data.percent));
                        setData({...data, newAmount:data.amount, tax:tax, final: final })
                        return;
                    }                                    
            }
        }

        return(
            <div>
                <div className='row'>
                    <InputField 
                        label="Amount"
                        value={data.amount}
                        onChange={(e)=>setData({...data,amount:e.target.value})}
                        required
                    />
                    <InputField 
                        label="Percent"
                        value={data.percent}
                        onChange={(e)=>setData({...data,percent:e.target.value})}
                        required
                    />
                    {(item === "TDS") && <InputField 
                        label="TDS"
                        value={data.tds}
                        onChange={(e)=>setData({...data,tds:e.target.value})}
                        required
                    />}
                </div>
                <div className='row' style={{margin: '10px auto'}}>
                    <ButtonWrapper label="Calculate" onClick={discountCalc}/>  
                    <ButtonWrapper label="Reset" onClick={()=>{setData({amount:0, percent:18, tds:2, newAmount:0, tax:0, tdsCalc:0, final:0})}} outlined/>                 
                </div>
                <div className='row'>
                    <InputField label="Amount" value={data.newAmount} disabled/>
                    <InputField label="Tax" value={data.tax} disabled/>
                    {(item === "TDS") && <InputField label="TDS" value={data.tdsCalc} disabled/>}
                    <InputField label="Final" value={data.final} disabled/>                    
                </div>
            </div>
        )
    }

    return <>{<DialogContent/>}</>;
}

export default ContentBox;