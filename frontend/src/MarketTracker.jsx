import React from 'react';
import { BitcoinWidget } from './BitcoinTracker.jsx';
import useSharedSimulation from './useSharedSimulation.js';
import { readMarket } from './marketClient.js';
import RateQueryHistory from './RateQueryHistory.jsx';
const publicApi={read:readMarket};
export default function MarketTracker({api=publicApi}) {
  const {data,error}=useSharedSimulation(api);
  return <>
    <section className="page-intro"><p className="text__eyebrow">PUBLIC MARKET DATA · BTC / USDT</p>
      <h1 className="page-intro__title" tabIndex={-1}>Bitcoin <span>Tracker.</span></h1>
      <p className="page-intro__subtitle">Market prices and saved readings from the server. Opening this page does not change tracking or trading.</p>
    </section>
    {error&&<p className="notice notice--error" role="alert">{error}</p>}
    {data?<BitcoinWidget readOnly tracker={{...data,shared:true,visible:true,pending:false}}
      rateHistory={<RateQueryHistory summary={data.rateQueries} loader={api.history} periodLoader={api.historyPeriods}/>}/>
      :<p role="status">Loading market readings…</p>}
  </>;
}
