from ppg_incidents.bhpa_parser import parse_bhpa_html


def test_parse_pilot_injury_with_span():
    html = """
    <table id="tbl_fit2">
    <tr class="tr1">
    <td class="td_collapse">
    <div class="bold text_hide1">Date<br></div>
    05.05.2018<br><br>
    </td>
    <td class="td_collapse">
    <div class="bold text_hide1">Pilot<br></div>
    Male<br><br><span class="bold">Age:</span><br>35<br><br><span class="bold">Flying Experience:</span><br>16 years<br><br><br></td>
    <td class="td_collapse">
    <div class="bold text_hide1">Location<br></div>
    UK<br><br><span class="bold">Wind Strength:</span><br>0-5 km/h<br><br><span class="bold">Conditions:</span><br>Calm,<br>Not Turbulent</td>
    <td class="td_collapse">
    <div class="bold text_hide1"><br>Wing Type<br></div>
    Powered PG<br><br><span class="bold">Wing:</span><br>Ozone<br>Freeride<br><br><span class="bold">Launch Type:</span><br>Foot</td>
    <td class="td_collapse">
    <div class="bold text_hide1"><br>Summary<br></div>
    Pilot was flying low approx 8.30pm towards setting sun and taking care looking for obstacles. Did not see low level power line and collided with the cables.<br><br>
    </td>
    <td class="td_collapse">
    <div class="bold text_hide1">Injury<br></div>
    <span class="bold">Pilot</span>:<br>Seriously Injured</td>
    </tr>
    </table>
    """
    
    incidents = parse_bhpa_html(html)
    
    assert len(incidents) == 1
    incident = incidents[0]
    assert incident.injury == "Seriously Injured"
    assert incident.date == "05.05.2018"

