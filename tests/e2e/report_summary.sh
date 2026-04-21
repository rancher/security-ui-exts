#!/bin/bash

job_timestamp=`date +"%m-%d-%Y"`
curDir=`pwd`

#buildversion=`cat uiversion.json  | grep \"version\" | cut -Ic 18- | sed 's/.$//'`

# list all sub directories contains "testsummary."
#subPath=$(find _reports_/ -type f | grep SBOMSCANNER_TEST_ | cut -c 1- | sort -r)

#i=0
#for path in $subPath
#do
#	echo $path
#	sleep .5
#	((i++))

#done > summary.out

##find _reports_/ -type f | grep SBOMSCANNER_TEST_ | cut -c 1- | sort -r > summary.out
ls -l _reports_/ | grep '^d' | awk '{print $9}' | sort -r > summary.out

# list all sub directories in _reports_ folder
# subDir=$(ls -l _reports_/ | grep '^d' | awk '{print $9}' | sort -r)

# copy report script to the directory and generate HTML format reports
#j=0
#for line in $subDir
#do
	#echo $line
#	if [[ ! -f _reports_/${line}/cypress_report.sh ]]; then
#	    echo " ** Copying cypress_report.sh script to _reports_/${line}/" 	
    	   # echo $_PASSWORD_ | sudo -S cp cypress_report.sh _reports_/${line}
#	    sleep 1
#	   # cd _reports_/${line}
           # echo $_PASSWORD_ | sudo -S ./cypress_report.sh
#	    sleep 2
#	    cd ${curDir}
#	    sleep .5
#	    echo "------"
 #   	else    
#		echo ""
#		echo "* Skipping _reports_/${line}/"
#	        echo ""
#	fi
#	((j++))
#done

# generate html report summary
function report_summary(){
		
		#LOG_URL=$(grep "Ref:" "_reports_/tmp.log" | awk -F' ' 'BEGIN{ORS="\n"} {print $2}')

		echo " <h2><b><u> SBOMSCANNER UI TEST REPORT SUMMARY </u></b></h2>"
		#echo " <h3>Date: ${job_timestamp} </h3><br>"

		echo "<style type="text/css">
			table, th, td {
                                border: 5px solid black;
                                } 
                        tr:nth-child(even) {
                                background-color: #bdb7b7;  
                        }
                        tr:nth-child(odd) {
                                background-color: #0bfa8a6;
                        }

			th {
   			        background-color: #174523;
    				color: white;
  			}
			.tg  {border-collapse:collapse;border-spacing:0;}
			.tg td{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;
			overflow:hidden;padding:10px 2px;word-break:normal;}
			.tg th{border-color:black;border-style:solid;border-width:1px;font-family:Arial, sans-serif;font-size:14px;
			font-weight:normal;overflow:hidden;padding:14px 15px;word-break:normal;}
			.tg .tg-0lax{text-align:center;vertical-align:center}
			</style>"

		echo "<table class='tg' > <th> Build Version </th> <th> Time </th> <th> Directory </th> "


	while read line; do
		
		###eval $(awk '/Tests:/ {total += $3} /Passing:/ {pass += $3} /Failing:/ {fail += $3} /Pending:/ {skip += $3} END {print "total="total";pass="pass";fail="fail";skip="skip}' ${line})

		sleep .5

		#buildnum=$(cat ${line} | grep 'nv_manager' | cut -c 25-)
		#
	

	        buildnum=$(cat _reports_/${line}/uiversion.json  | grep \"version\" | cut -c 18- | sed 's/.$//')
		autoname_run=$(echo ${line} | cut -d '_' -f -2) #SBOMSCANNER_UITEST_20260304_101010 will output "SBOMSCANNER_UITEST"

	#	autodate_run=$(echo ${line} | grep 'SBOMSCANNER_TEST_' | cut -c 18-)	
		autodate_run=$(echo ${line} |  cut -d '_' -f 3-)	
	
		##IN="${line}"
		##arrIN=(${IN//\// })
		###echo ${arrIN[0]} # extract the report folder str, 08182023_*** 

		echo "<tr>"
		echo "<td class='tg-0lax'>"
		echo ${buildnum} "</td>"
		
		#echo "<td class='tg-0lax'><font color=black> def${autotest_type} </td>"
		echo "<td class='tg-0lax'><font color=black> ${autodate_run} </td>"
		
		echo "<td><font color=black class='tg-0lax'> &ensp; &#8226; test result click <a href=http://NODEIP:PORT/_reports_/${line}/index.html> here </a> &#8226; &ensp; <br>"
	       	##${arrIN[1]}/index.html> here </a> &#8226; &ensp;<br>"
		
		##echo "<td class='tg-0lax'><font color=green> ${pass_rate}%</font></td>"
		##echo "<td class='tg-0lax'><font color=red> ${fail_rate}%</font></td>"

		echo "</tr>"
		
	done <summary.out
}

#echo "</table>"

report_summary > pw_report_summary.html
echo ""
echo " *** Done exporting report summary to html *** "
echo ""

