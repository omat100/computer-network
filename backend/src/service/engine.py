try:
    import network_engine
except ModuleNotFoundError:
    from . import fallback_engine as network_engine

__all__ = ["network_engine"]
