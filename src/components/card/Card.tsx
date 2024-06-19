import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

export default function BasicCard({
  color,
  title,
  count,
  icon,
  titleColor,
}: any) {
  return (
    <Card
      sx={{
        minWidth: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: color,
        border: color,
        borderRadius: "10px",
      }}
      variant="outlined"
    >
      <CardContent
        sx={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <div>
          <Typography variant="h4" component="div">
            {icon}
          </Typography>
          <Typography sx={{ mb: 1.5 }} color={titleColor}>
            {title}
          </Typography>
          <CardActions
            sx={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Typography variant="h5" component="span" color={titleColor}>
              {count}
            </Typography>
          </CardActions>
        </div>
      </CardContent>
    </Card>
  );
}
