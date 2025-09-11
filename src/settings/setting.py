import json


class Setting:
    _setting = None

    @classmethod
    def read_settings(cls):
        if cls._setting is None:
            with open('appsettings.json', 'r') as file:
                cls._setting = json.loads(file.read())
        return cls._setting


SETTINGS = Setting.read_settings()
