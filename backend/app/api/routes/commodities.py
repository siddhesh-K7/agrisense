from fastapi import APIRouter, Query
from app.ml.price_preprocessing import get_available_commodities_and_markets, get_hierarchy
from app.ml.demand_preprocessing import get_demand_metadata_options

router = APIRouter(prefix="/commodities", tags=["Commodities & Markets Metadata"])

@router.get("")
def list_commodities_and_coverage():
    price_coverage = get_available_commodities_and_markets()
    demand_coverage = get_demand_metadata_options()
    
    return {
        "price_forecasting": {
            "commodities": price_coverage["commodities"],
            "total_commodities": price_coverage["total_commodities"]
        },
        "demand_forecasting": demand_coverage
    }

@router.get("/hierarchy")
def get_full_hierarchy():
    return get_hierarchy()

@router.get("/states")
def get_states_for_commodity(commodity: str = Query(default="Onion")):
    hierarchy = get_hierarchy()
    states_dict = hierarchy.get(commodity, {})
    return {
        "commodity": commodity,
        "states": sorted(list(states_dict.keys()))
    }

@router.get("/markets")
def get_markets_for_commodity_state(
    commodity: str = Query(default="Onion"),
    state: str = Query(default="Maharashtra")
):
    hierarchy = get_hierarchy()
    states_dict = hierarchy.get(commodity, {})
    markets = states_dict.get(state, [])
    return {
        "commodity": commodity,
        "state": state,
        "markets": ["State Average", "All Markets"] + sorted(markets)
    }
